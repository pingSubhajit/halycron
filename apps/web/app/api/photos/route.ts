import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {z} from 'zod'
import {db} from '@/db/drizzle'
import {photo} from '@/db/schema'
import {headers} from 'next/headers'
import {generatePresignedDownloadUrl, s3Client} from '@/lib/s3-client'
import {DeleteObjectCommand} from '@aws-sdk/client-s3'
import {eq} from 'drizzle-orm'

const photoMetadataSchema = z.object({
	fileKey: z.string(),
	encryptedKey: z.string(),
	keyIv: z.string(),
	originalFilename: z.string(),
	mimeType: z.string().regex(/^image\/(jpeg|png|jpg|heic|raw)$/),
	imageWidth: z.number().optional(),
	imageHeight: z.number().optional()
})

export const POST = async (req: NextRequest) => {
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
			mimeType,
			imageWidth,
			imageHeight
		} = result.data

		// Save photo metadata to database
		const savedPhoto = await db.insert(photo).values({
			userId: session.user.id,
			encryptedFileKey: encryptedKey,
			fileKeyIv: keyIv,
			s3Key: fileKey,
			originalFilename,
			mimeType,
			imageWidth,
			imageHeight
		}).returning()

		return NextResponse.json(savedPhoto[0])
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

export const GET = async () => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const photos = await db.query.photo.findMany({
			where: (photos, {eq}) => eq(photos.userId, session.user.id),
			orderBy: (photos, {desc}) => [desc(photos.createdAt)]
		})

		// Generate pre-signed URLs for each photo
		const photosWithUrls = await Promise.all(photos.map(async (photo) => {
			const url = await generatePresignedDownloadUrl(photo.s3Key)
			return {
				id: photo.id,
				url,
				originalFilename: photo.originalFilename,
				createdAt: photo.createdAt,
				encryptedKey: photo.encryptedFileKey,
				keyIv: photo.fileKeyIv,
				mimeType: photo.mimeType,
				imageWidth: photo.imageWidth,
				imageHeight: photo.imageHeight
			}
		}))

		return NextResponse.json(photosWithUrls)
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

export const DELETE = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {photoId} = await req.json()
		if (!photoId) {
			return NextResponse.json({error: 'Photo ID is required'}, {status: 400})
		}

		// Get the photo to verify ownership and get S3 key
		const photoToDelete = await db.query.photo.findFirst({
			where: (photos, {and, eq}) => and(
				eq(photos.id, photoId),
				eq(photos.userId, session.user.id)
			)
		})

		if (!photoToDelete) {
			return NextResponse.json({error: 'Photo not found'}, {status: 404})
		}

		// Delete from S3
		await s3Client.send(new DeleteObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: photoToDelete.s3Key
		}))

		// Delete from database
		await db.delete(photo).where(eq(photo.id, photoId))

		return NextResponse.json({success: true})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
