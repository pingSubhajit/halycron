import {createHash} from 'crypto'
import {db} from '@/db/drizzle'
import {album} from '@/db/schema'
import {and, eq} from 'drizzle-orm'
import {Album} from './types'
import {hashPin as secureHashPin, verifyPin} from '@/lib/auth/password'

// Legacy hash function for backward compatibility
export const hashPin = (pin: string): string => createHash('sha256').update(pin).digest('hex')

/**
 * Check if a user has access to an album
 * @param albumId - The album ID to check
 * @param userId - The user ID to check
 * @returns Whether the user has access to the album
 */
export const checkAlbumAccess = async (albumId: string, userId: string): Promise<boolean> => {
	const albumRecord = await db.query.album.findFirst({
		where: and(
			eq(album.id, albumId),
			eq(album.userId, userId)
		)
	})
	return !!albumRecord
}

/**
 * Verify a PIN for an album
 * @param albumId - The album ID to check
 * @param pin - The PIN to verify
 * @returns Whether the PIN is valid
 */
export const verifyAlbumPin = async (albumId: string, pin: string): Promise<boolean> => {
	const result = await db.query.album.findFirst({
		where: eq(album.id, albumId),
		columns: {
			pinHash: true
		}
	})

	if (!result?.pinHash) return false

	// First try bcrypt verification
	const bcryptMatch = await verifyPin(pin, result.pinHash)
	if (bcryptMatch) return true

	// Fall back to SHA-256 for backward compatibility
	return result.pinHash === hashPin(pin)
}

/**
 * Get an album with its photo count
 * @param albumId - The album ID to get
 * @returns The album with photo count
 */
export const getAlbumWithPhotoCount = async (albumId: string): Promise<Album | null> => {
	const result = await db.query.album.findFirst({
		where: eq(album.id, albumId),
		with: {
			photos: {
				columns: {
					photoId: true
				}
			}
		}
	})

	if (!result) return null

	return {
		id: result.id,
		name: result.name,
		isSensitive: result.isSensitive,
		isProtected: result.isProtected,
		createdAt: result.createdAt,
		updatedAt: result.updatedAt,
		_count: {
			photos: result.photos.length
		}
	}
}
