import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {z} from 'zod'
import {db} from '@/db/drizzle'
import {photo} from '@/db/schema'
import {headers} from 'next/headers'

const photoMetadataSchema = z.object({
	fileKey: z.string(),
	encryptedKey: z.string(),
	keyIv: z.string(),
	originalFilename: z.string(),
	fileSize: z.number(),
	mimeType: z.string().regex(/^image\/(jpeg|png|jpg|heic|raw)$/)
})

export async function POST(req: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body = await req.json()
		const result = photoMetadataSchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request body'},
				{status: 400}
			)
		}

		const {
			fileKey,
			encryptedKey,
			keyIv,
			originalFilename,
			fileSize,
			mimeType
		} = result.data

		// Save photo metadata to database
		const savedPhoto = await db.insert(photo).values({
			userId: session.user.id,
			encryptedFileKey: encryptedKey,
			fileKeyIv: keyIv,
			s3Key: fileKey,
			originalFilename,
			mimeType
		}).returning()

		return NextResponse.json(savedPhoto[0])
	} catch (error) {
		console.error('Error saving photo metadata:', error)
		return NextResponse.json(
			{error: 'Internal server error'},
			{status: 500}
		)
	}
}
