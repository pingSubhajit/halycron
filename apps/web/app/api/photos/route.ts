import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {z} from 'zod'
import {db} from '@/db/drizzle'
import {photo} from '@/db/schema'
import {headers} from 'next/headers'
import {generatePresignedDownloadUrl, s3Client} from '@/lib/s3-client'
import {HeadObjectCommand} from '@aws-sdk/client-s3'
import {eq} from 'drizzle-orm'

const photoMetadataSchema = z.object({
	fileKey: z.string(),
	encryptedFileKey: z.string(),
	fileKeyIv: z.string(),
	fileIv: z.string(),  // Added fileIv for file encryption
	originalFilename: z.string(),
	mimeType: z.string().regex(
		/^(image\/(jpeg|png|jpg|heic|heif|avif|avis|webp|raw|arw|cr2|nef|orf|rw2)|application\/octet-stream)$/,
		'Unsupported image format'
	),
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
			encryptedFileKey,
			fileKeyIv,
			fileIv,
			originalFilename,
			mimeType,
			imageWidth,
			imageHeight
		} = result.data

		// Save photo metadata to database
		const savedPhoto = await db.insert(photo).values({
			userId: session.user.id,
			encryptedFileKey: encryptedFileKey,
			fileKeyIv: fileKeyIv,
			fileIv: fileIv,
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
			orderBy: (photos, {desc}) => [desc(photos.createdAt)],
			with: {
				albums: {
					with: {
						album: true
					}
				}
			}
		})

		/*
		 * Filter out photos that:
		 * 1. Belong to at least one sensitive album
		 * 2. Only belong to protected albums (all albums the photo belongs to are protected)
		 */
		const filteredPhotos = photos.filter(photo => {
			// Check if the photo belongs to any sensitive album
			if (photo.albums?.some(pa => pa.album.isSensitive)) {
				return false
			}

			// If the photo has no albums, include it
			if (!photo.albums || photo.albums.length === 0) {
				return true
			}

			/*
			 * Check if the photo belongs to at least one non-protected album
			 * If all albums are protected, filter it out
			 */
			return photo.albums.some(pa => !pa.album.isProtected)
		})

		// Generate pre-signed URLs for each photo
		const photosWithUrls = await Promise.all(filteredPhotos.map(async (photo) => {
			const url = await generatePresignedDownloadUrl(photo.s3Key)
			return {
				id: photo.id,
				url,
				originalFilename: photo.originalFilename,
				createdAt: photo.createdAt,
				encryptedFileKey: photo.encryptedFileKey,
				fileKeyIv: photo.fileKeyIv,
				fileIv: photo.fileIv,
				mimeType: photo.mimeType,
				imageWidth: photo.imageWidth,
				imageHeight: photo.imageHeight,
				albums: photo.albums?.map(pa => ({
					id: pa.album.id,
					name: pa.album.name
				})) || []
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

		// Only delete from database, keep the S3 file for potential restore
		await db.delete(photo).where(eq(photo.id, photoId))

		// Return the deleted photo data for restoration
		const url = await generatePresignedDownloadUrl(photoToDelete.s3Key)
		return NextResponse.json({
			id: photoToDelete.id,
			url,
			s3Key: photoToDelete.s3Key,
			originalFilename: photoToDelete.originalFilename,
			createdAt: photoToDelete.createdAt,
			encryptedFileKey: photoToDelete.encryptedFileKey,
			fileKeyIv: photoToDelete.fileKeyIv,
			fileIv: photoToDelete.fileIv,
			mimeType: photoToDelete.mimeType,
			imageWidth: photoToDelete.imageWidth,
			imageHeight: photoToDelete.imageHeight
		})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

export const PATCH = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const photoData = await req.json()

		if (!photoData || !photoData.id || !photoData.s3Key) {
			return NextResponse.json({error: 'Invalid photo data'}, {status: 400})
		}

		// Check if the photo exists in S3
		try {
			await s3Client.send(new HeadObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: photoData.s3Key
			}))
		} catch (error) {
			return NextResponse.json({error: error instanceof Error ? error.message : 'Photo file no longer exists'}, {status: 404})
		}

		// Restore photo in database
		const restoredPhoto = await db.insert(photo).values({
			id: photoData.id,
			userId: session.user.id,
			encryptedFileKey: photoData.encryptedFileKey,
			fileKeyIv: photoData.fileKeyIv,
			fileIv: photoData.fileIv,
			s3Key: photoData.s3Key,
			originalFilename: photoData.originalFilename,
			mimeType: photoData.mimeType,
			imageWidth: photoData.imageWidth,
			imageHeight: photoData.imageHeight,
			createdAt: new Date(photoData.createdAt),
			updatedAt: new Date()
		}).returning()

		return NextResponse.json(restoredPhoto[0])
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
