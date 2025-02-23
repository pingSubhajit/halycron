import {createHash} from 'crypto'
import {db} from '@/db/drizzle'
import {album, photosToAlbums} from '@/db/schema'
import {and, eq, inArray} from 'drizzle-orm'
import {Album} from './types'

export const hashPin = (pin: string): string => createHash('sha256').update(pin).digest('hex')

export async function verifyAlbumPin(albumId: string, pin: string): Promise<boolean> {
	const result = await db.query.album.findFirst({
		where: eq(album.id, albumId),
		columns: {
			pinHash: true
		}
	})

	if (!result?.pinHash) return false
	return result.pinHash === hashPin(pin)
}

export const checkAlbumAccess = async (albumId: string, userId: string): Promise<boolean> => {
	const result = await db.query.album.findFirst({
		where: and(
			eq(album.id, albumId),
			eq(album.userId, userId)
		)
	})
	return !!result
}

export const getAlbumWithPhotoCount = async (albumId: string): Promise<Album | null> => {
	const result = await db.query.album.findFirst({
		where: eq(album.id, albumId),
		with: {
			photos: true
		}
	})

	if (!result) return null

	return {
		id: result.id,
		name: result.name,
		isSensitive: result.isSensitive,
		isProtected: result.isProtected,
		createdAt: result.createdAt ?? new Date(),
		updatedAt: result.updatedAt ?? new Date(),
		_count: {
			photos: Object.keys(result.photos).length
		}
	}
}

export const addPhotosToAlbum = async (albumId: string, photoIds: string[]): Promise<void> => {
	await db.insert(photosToAlbums).values(
		photoIds.map(photoId => ({
			albumId,
			photoId
		}))
	)
}

export const removePhotosFromAlbum = async (albumId: string, photoIds: string[]): Promise<void> => {
	await db.delete(photosToAlbums)
		.where(
			and(
				eq(photosToAlbums.albumId, albumId),
				inArray(photosToAlbums.photoId, photoIds)
			)
		)
}
