import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {db} from '@/db/drizzle'
import {and, eq, inArray} from 'drizzle-orm'
import {album, photo, sharedAlbums, sharedLink, sharedPhotos} from '@/db/schema'
import {nanoid} from 'nanoid'
import {createHash} from 'crypto'
import {CreateShareLinkRequest, CreateShareLinkResponse} from './types'
import {getBaseUrl} from '@/lib/utils'
import {addDays, addHours, addMinutes} from 'date-fns'
import {headers} from 'next/headers'

// Helper function to calculate expiry date based on option
function calculateExpiryDate(expiryOption: string): Date {
	switch (expiryOption) {
	case '5min':
		return addMinutes(new Date(), 5)
	case '15min':
		return addMinutes(new Date(), 15)
	case '30min':
		return addMinutes(new Date(), 30)
	case '1h':
		return addHours(new Date(), 1)
	case '8h':
		return addHours(new Date(), 8)
	case '24h':
		return addHours(new Date(), 24)
	case '3d':
		return addDays(new Date(), 3)
	case '7d':
		return addDays(new Date(), 7)
	case '30d':
		return addDays(new Date(), 30)
	default:
		return addHours(new Date(), 24) // Default to 24 hours
	}
}

// Helper function to hash PIN
function hashPin(pin: string): string {
	return createHash('sha256').update(pin).digest('hex')
}

// Helper function to validate PIN is 4 digits
function validatePin(pin: string | undefined): boolean {
	if (!pin) return false
	return /^\d{4}$/.test(pin)
}

// POST - Create a new share link
export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body: CreateShareLinkRequest = await req.json()
		const {photoIds, albumIds, expiryOption, pin} = body

		// Validate request - must have either photoIds or albumIds
		if ((!photoIds || photoIds.length === 0) && (!albumIds || albumIds.length === 0)) {
			return NextResponse.json({error: 'No photos or albums to share'}, {status: 400})
		}

		// Validate PIN format if provided
		if (pin && !validatePin(pin)) {
			return NextResponse.json({error: 'PIN must be exactly 4 digits'}, {status: 400})
		}

		// Check if these photos/albums belong to the user
		if (photoIds && photoIds.length > 0) {
			const userPhotos = await db.select({id: photo.id})
				.from(photo)
				.where(and(
					eq(photo.userId, session.user.id),
					inArray(photo.id, photoIds)
				))

			if (userPhotos.length !== photoIds.length) {
				return NextResponse.json({error: 'One or more photos do not belong to the user'}, {status: 403})
			}
		}

		if (albumIds && albumIds.length > 0) {
			const userAlbums = await db.select({id: album.id, isSensitive: album.isSensitive, isProtected: album.isProtected})
				.from(album)
				.where(and(
					eq(album.userId, session.user.id),
					inArray(album.id, albumIds)
				))

			if (userAlbums.length !== albumIds.length) {
				return NextResponse.json({error: 'One or more albums do not belong to the user'}, {status: 403})
			}

			// Check if any sensitive or protected albums require PIN
			const hasProtectedAlbum = userAlbums.some(album => album.isSensitive || album.isProtected)
			if (hasProtectedAlbum && !pin) {
				return NextResponse.json({error: 'PIN required for sharing protected or sensitive albums'}, {status: 400})
			}
		}

		// Generate token for the shared link
		const token = nanoid(12)
		const expiresAt = calculateExpiryDate(expiryOption)

		// Create shared link record
		const [newSharedLink] = await db.insert(sharedLink)
			.values({
				userId: session.user.id,
				token,
				isPinProtected: Boolean(pin),
				pinHash: pin ? hashPin(pin) : null,
				expiresAt
			})
			.returning()

		// Ensure shared link was created
		if (!newSharedLink) {
			return NextResponse.json({error: 'Failed to create share link'}, {status: 500})
		}

		// Create shared photos records if any
		if (photoIds && photoIds.length > 0) {
			await db.insert(sharedPhotos)
				.values(photoIds.map(photoId => ({
					sharedLinkId: newSharedLink.id,
					photoId
				})))
		}

		// Create shared albums records if any
		if (albumIds && albumIds.length > 0) {
			await db.insert(sharedAlbums)
				.values(albumIds.map(albumId => ({
					sharedLinkId: newSharedLink.id,
					albumId
				})))
		}

		// Generate share URL
		const shareUrl = `${getBaseUrl()}/shared/${token}`

		return NextResponse.json({
			shareLink: {
				id: newSharedLink.id,
				token: newSharedLink.token,
				isPinProtected: newSharedLink.isPinProtected,
				expiresAt: newSharedLink.expiresAt,
				createdAt: newSharedLink.createdAt
			},
			shareUrl
		} as CreateShareLinkResponse)
	} catch (error) {
		console.error('Error creating share link:', error)
		return NextResponse.json({error: 'Failed to create share link'}, {status: 500})
	}
}
