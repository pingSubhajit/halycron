import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {and, eq, gt} from 'drizzle-orm'
import {sharedLink, sharedLinkKeys, sharedPhotos, sharedAlbums, photo, album, photosToAlbums} from '@/db/schema'
import {GetSharedItemsResponse} from '../types'
import {generatePresignedDownloadUrl} from '@/lib/s3-client'

// GET /api/shared/[token] - Get shared items for a token
export const GET = async (
	req: NextRequest,
	{params}: { params: Promise<{ token: string }> }
) => {
	try {
		const {token} = await params

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

		// If PIN-protected, require a short-lived verification cookie before returning any content.
		if (link.isPinProtected) {
			const cookieName = `shared-access-${token}`
			const hasAccess = req.cookies.get(cookieName)?.value === '1'
			if (!hasAccess) {
				const hasAlbum = await db
					.select({albumId: sharedAlbums.albumId})
					.from(sharedAlbums)
					.where(eq(sharedAlbums.sharedLinkId, link.id))
					.limit(1)
				const response: GetSharedItemsResponse & {requiresPin: true} = {
					shareType: hasAlbum.length > 0 ? 'album' : 'photo',
					isPinProtected: true,
					expiresAt: link.expiresAt,
					requiresPin: true
				}
				return NextResponse.json(response)
			}
		}

		// Get shared photos if any (E2EE share-wrapped DEK + encrypted filename)
		const sharedPhotoItems = await Promise.all((await db
			.select({
				id: photo.id,
				s3Key: photo.s3Key,
				mimeType: photo.mimeType,
				imageWidth: photo.imageWidth,
				imageHeight: photo.imageHeight,
				createdAt: photo.createdAt,
				// photo byte encryption IV (v1 uses contentIv; legacy uses fileKeyIv)
				encryptionVersion: photo.encryptionVersion,
				contentIv: photo.contentIv,
				fileKeyIv: photo.fileKeyIv,
				// share-specific key material
				wrappedDekForShare: sharedPhotos.wrappedDekForShare,
				wrappedDekForShareIv: sharedPhotos.wrappedDekForShareIv,
				encryptedFilenameForShare: sharedPhotos.encryptedFilenameForShare,
				filenameForShareIv: sharedPhotos.filenameForShareIv
			})
			.from(sharedPhotos)
			.innerJoin(photo, eq(sharedPhotos.photoId, photo.id))
			.where(eq(sharedPhotos.sharedLinkId, link.id)))
			.map(async (row) => ({
				...row,
				url: await generatePresignedDownloadUrl(row.s3Key),
				// Normalize to a single IV field for clients
				contentIv: row.contentIv || row.fileKeyIv
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

		// For each album, get the photos in the album (restricted to photos included in this share)
		const albumPhotos = await Promise.all(sharedAlbumItems.map(async (albumItem) => {
			const photos = await Promise.all((await db
				.select({
					id: photo.id,
					s3Key: photo.s3Key,
					mimeType: photo.mimeType,
					imageWidth: photo.imageWidth,
					imageHeight: photo.imageHeight,
					createdAt: photo.createdAt,
					encryptionVersion: photo.encryptionVersion,
					contentIv: photo.contentIv,
					fileKeyIv: photo.fileKeyIv,
					wrappedDekForShare: sharedPhotos.wrappedDekForShare,
					wrappedDekForShareIv: sharedPhotos.wrappedDekForShareIv,
					encryptedFilenameForShare: sharedPhotos.encryptedFilenameForShare,
					filenameForShareIv: sharedPhotos.filenameForShareIv
				})
				.from(photosToAlbums)
				.innerJoin(photo, eq(photosToAlbums.photoId, photo.id))
				.innerJoin(sharedPhotos, and(
					eq(sharedPhotos.photoId, photo.id),
					eq(sharedPhotos.sharedLinkId, link.id)
				))
				.where(eq(photosToAlbums.albumId, albumItem.id)))
				.map(async (row) => ({
					...row,
					url: await generatePresignedDownloadUrl(row.s3Key),
					contentIv: row.contentIv || row.fileKeyIv
				})))

			return {
				...albumItem,
				photos
			}
		}))

		// Determine share type (albums take precedence)
		const shareType = sharedAlbumItems.length > 0 ? 'album' : 'photo'

		const response: GetSharedItemsResponse = {
			shareType,
			isPinProtected: link.isPinProtected,
			expiresAt: link.expiresAt,
			...(shareType === 'photo' ? {photos: sharedPhotoItems} : {albums: albumPhotos})
		}

		// Include PIN-wrapped Share Key material for PIN shares (client needs it to decrypt)
		if (link.isPinProtected) {
			const [keys] = await db.select().from(sharedLinkKeys).where(eq(sharedLinkKeys.sharedLinkId, link.id)).limit(1)
			;(response as any).pinKeyMaterial = keys ? {
				skWrappedByPin: keys.skWrappedByPin,
				pinKdfSalt: keys.pinKdfSalt,
				pinKdfParams: keys.pinKdfParams,
				skWrapIv: keys.skWrapIv
			} : null
		}

		return NextResponse.json(response)
	} catch (error) {
		console.error('Error getting shared items:', error)
		return NextResponse.json({error: 'Failed to get shared items'}, {status: 500})
	}
}
