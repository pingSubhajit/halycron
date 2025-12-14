import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {photo} from '@/db/schema'
import {and, eq} from 'drizzle-orm'
import {CopyObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3'
import {s3Client, generateUniqueFileKey} from '@/lib/s3-client'
import {z} from 'zod'

const bodySchema = z.object({
	photoId: z.string().uuid()
})

/**
 * Migration step to remove filename leakage in S3 object keys by copying to a new random key.
 * This does not decrypt bytes; it's a server-side S3 copy + DB update.
 */
export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

		const parsed = bodySchema.safeParse(await req.json())
		if (!parsed.success) return NextResponse.json({error: 'Invalid request body'}, {status: 400})

		const {photoId} = parsed.data

		const existing = await db.query.photo.findFirst({
			where: (p, {and, eq}) => and(eq(p.id, photoId), eq(p.userId, session.user.id))
		})
		if (!existing) return NextResponse.json({error: 'Photo not found'}, {status: 404})

		const bucket = process.env.AWS_BUCKET_NAME
		if (!bucket) return NextResponse.json({error: 'Server configuration error'}, {status: 500})

		const newKey = generateUniqueFileKey(session.user.id, undefined)

		// Copy the encrypted object bytes to the new key.
		await s3Client.send(new CopyObjectCommand({
			Bucket: bucket,
			Key: newKey,
			CopySource: `${bucket}/${existing.s3Key}`,
			ServerSideEncryption: 'AES256'
		}))

		// Update DB first; then delete old object. If deletion fails, we can retry cleanup later.
		await db.update(photo).set({
			s3Key: newKey,
			updatedAt: new Date()
		}).where(and(eq(photo.id, photoId), eq(photo.userId, session.user.id)))

		// Best-effort delete old object
		await s3Client.send(new DeleteObjectCommand({
			Bucket: bucket,
			Key: existing.s3Key
		}))

		return NextResponse.json({success: true, oldKey: existing.s3Key, newKey})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}


