import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {and, eq, gt} from 'drizzle-orm'
import {sharedLink, sharedPhotos, sharedAlbums, photo, album, photosToAlbums} from '@/db/schema'
import {GetSharedItemsResponse} from '../types'
import {generatePresignedDownloadUrl} from '@/lib/s3-client'

// GET /api/shared/[token] - Get shared items for a token
export async function GET(
	req: NextRequest,
	{params}: { params: { token: string } }
) {
	try {
		const {token} = params

		// Find the shared link
		const [link] = await db
			.select()
			.from(sharedLink)
			.where(and(
				eq(sharedLink.token, token),
				gt(sharedLink.expiresAt, new Date()) // Only return if not expired
			))

		if (!link) {
			return NextResponse.json({error: 'Invalid or expired share link'}, {status: 404})
		}

		// Get shared photos if any
		const sharedPhotoItems = await Promise.all((await db
			.select({
				id: photo.id,
				s3Key: photo.s3Key,
				originalFilename: photo.originalFilename,
				mimeType: photo.mimeType,
				encryptedFileKey: photo.encryptedFileKey,
				fileKeyIv: photo.fileKeyIv,
				imageWidth: photo.imageWidth,
				imageHeight: photo.imageHeight,
				createdAt: photo.createdAt
			})
			.from(sharedPhotos)
			.innerJoin(photo, eq(sharedPhotos.photoId, photo.id))
			.where(eq(sharedPhotos.sharedLinkId, link.id)))
			.map(async (photo) => ({
				...photo,
				url: await generatePresignedDownloadUrl(photo.s3Key)
			})))

		// Get shared albums if any
		const sharedAlbumItems = await db
			.select({
				id: album.id,
				name: album.name,
				isSensitive: album.isSensitive,
				isProtected: album.isProtected,
				createdAt: album.createdAt,
				updatedAt: album.updatedAt
			})
			.from(sharedAlbums)
			.innerJoin(album, eq(sharedAlbums.albumId, album.id))
			.where(eq(sharedAlbums.sharedLinkId, link.id))

		// For each album, get the photos in the album
		const albumPhotos = await Promise.all(sharedAlbumItems.map(async (albumItem) => {
			const photos = await Promise.all((await db
				.select({
					id: photo.id,
					s3Key: photo.s3Key,
					originalFilename: photo.originalFilename,
					mimeType: photo.mimeType,
					encryptedFileKey: photo.encryptedFileKey,
					fileKeyIv: photo.fileKeyIv,
					imageWidth: photo.imageWidth,
					imageHeight: photo.imageHeight,
					createdAt: photo.createdAt
				})
				.from(photosToAlbums)
				.innerJoin(photo, eq(photosToAlbums.photoId, photo.id))
				.where(eq(photosToAlbums.albumId, albumItem.id)))
				.map(async (photo) => ({
					...photo,
					url: await generatePresignedDownloadUrl(photo.s3Key)
				})))

			return {
				...albumItem,
				photos
			}
		}))

		// Determine share type
		const shareType = sharedPhotoItems.length > 0 ? 'photo' : 'album'

		const response: GetSharedItemsResponse = {
			shareType,
			isPinProtected: link.isPinProtected,
			expiresAt: link.expiresAt,
			...(shareType === 'photo' ? {photos: sharedPhotoItems} : {albums: albumPhotos})
		}

		return NextResponse.json(response)
	} catch (error) {
		console.error('Error getting shared items:', error)
		return NextResponse.json({error: 'Failed to get shared items'}, {status: 500})
	}
}
