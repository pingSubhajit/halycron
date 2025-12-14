import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {photo} from '@/db/schema'
import {and, eq} from 'drizzle-orm'
import {z} from 'zod'

const bodySchema = z.object({
	photoId: z.string().uuid(),
	// v1 fields to populate
	contentIv: z.string().min(1),
	wrappedDek: z.string().min(1),
	wrappedDekIv: z.string().min(1),
	encryptedFilename: z.string().min(1),
	filenameIv: z.string().min(1)
})

/**
 * Client-driven migration: convert a legacy photo row (v0) into v1 fields without re-uploading bytes.
 *
 * NOTE: This does NOT address filename leakage in existing S3 object keys. That requires a separate
 * S3 key migration (copy/rename) step.
 */
export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

		const parsed = bodySchema.safeParse(await req.json())
		if (!parsed.success) return NextResponse.json({error: 'Invalid request body'}, {status: 400})

		const body = parsed.data

		// Only migrate rows owned by this user and still in legacy mode.
		const [updated] = await db.update(photo).set({
			encryptionVersion: 1,
			contentIv: body.contentIv,
			wrappedDek: body.wrappedDek,
			wrappedDekIv: body.wrappedDekIv,
			encryptedFilename: body.encryptedFilename,
			filenameIv: body.filenameIv,
			// Remove legacy plaintext fields to satisfy zero-knowledge in DB
			encryptedFileKey: null,
			fileKeyIv: null,
			originalFilename: null,
			updatedAt: new Date()
		}).where(and(
			eq(photo.id, body.photoId),
			eq(photo.userId, session.user.id),
			eq(photo.encryptionVersion, 0)
		)).returning()

		if (!updated) {
			return NextResponse.json({error: 'Photo not found or already migrated'}, {status: 404})
		}

		return NextResponse.json({success: true})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}


