import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {db} from '@/db/drizzle'
import {album} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {updateAlbumSchema} from '../types'
import {checkAlbumAccess, getAlbumWithPhotoCount} from '../utils'
import {headers} from 'next/headers'
import {hashPin as secureHashPin} from '@/lib/auth/password'
import {cookies} from 'next/headers'
import jwt from 'jsonwebtoken'

// Define the secret key for JWT
const JWT_SECRET = process.env.BETTER_AUTH_SECRET || 'album-protection-secret'

interface Props {
  params: Promise<{
	  id: string
  }>
}

export const GET = async (request: NextRequest, {params}: Props) => {
	const session = await auth.api.getSession({
		headers: await headers()
	})
	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const {id} = await params
	const hasAccess = await checkAlbumAccess(id, session.user.id)
	if (!hasAccess) {
		return new NextResponse('Not Found', {status: 404})
	}

	const result = await getAlbumWithPhotoCount(id)
	if (!result) {
		return new NextResponse('Not Found', {status: 404})
	}

	// For protected albums, check verification before returning full details
	if (result.isProtected) {
		// Get the verification cookie
		const verificationCookie = cookies().get(`album-access-${id}`)?.value
		
		if (!verificationCookie) {
			// For protected albums without verification, return limited info
			return NextResponse.json({
				id: result.id,
				name: result.name,
				isProtected: true,
				isSensitive: result.isSensitive,
				createdAt: result.createdAt,
				updatedAt: result.updatedAt,
				requiresPin: true,
				_count: { photos: result._count?.photos || 0 }
			})
		}
		
		try {
			// Verify the token
			const decoded = jwt.verify(verificationCookie, JWT_SECRET) as {
				albumId: string;
				userId: string;
				tokenType: string;
				exp: number;
			}
			
			// Check token validity
			if (
				decoded.albumId !== id ||
				decoded.userId !== session.user.id ||
				decoded.tokenType !== 'album-access' ||
				decoded.exp < Math.floor(Date.now() / 1000)
			) {
				// Return limited info if token is invalid
				return NextResponse.json({
					id: result.id,
					name: result.name,
					isProtected: true,
					isSensitive: result.isSensitive,
					createdAt: result.createdAt,
					updatedAt: result.updatedAt,
					requiresPin: true,
					_count: { photos: result._count?.photos || 0 }
				})
			}
		} catch (error) {
			// Return limited info if token verification fails
			return NextResponse.json({
				id: result.id,
				name: result.name,
				isProtected: true,
				isSensitive: result.isSensitive,
				createdAt: result.createdAt,
				updatedAt: result.updatedAt,
				requiresPin: true,
				_count: { photos: result._count?.photos || 0 }
			})
		}
	}

	// Return full album details if album is not protected or PIN is verified
	return NextResponse.json(result)
}

export const PATCH = async (request: NextRequest, {params}: Props) => {
	const session = await auth.api.getSession({
		headers: await headers()
	})
	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const {id} = await params
	const hasAccess = await checkAlbumAccess(id, session.user.id)
	if (!hasAccess) {
		return new NextResponse('Not Found', {status: 404})
	}

	const json = await request.json()
	const result = updateAlbumSchema.safeParse(json)

	if (!result.success) {
		return NextResponse.json(result.error.format(), {status: 400})
	}

	const {name, isSensitive, isProtected, pin} = result.data

	const updateData: Record<string, unknown> = {}
	if (name) updateData.name = name
	if (typeof isSensitive !== 'undefined') updateData.isSensitive = isSensitive
	if (typeof isProtected !== 'undefined') updateData.isProtected = isProtected
	
	// Handle PIN updates with secure hashing
	if (pin) {
		updateData.pinHash = await secureHashPin(pin)
	}

	// If isProtected is being set to false, clear the pinHash
	if (isProtected === false) {
		updateData.pinHash = null
	}

	const updatedAlbum = await db.update(album)
		.set(updateData)
		.where(eq(album.id, id))
		.returning()

	return NextResponse.json(updatedAlbum[0])
}

export const DELETE = async (request: NextRequest, {params}: Props) => {
	const session = await auth.api.getSession({
		headers: await headers()
	})
	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const {id} = await params
	const hasAccess = await checkAlbumAccess(id, session.user.id)
	if (!hasAccess) {
		return new NextResponse('Not Found', {status: 404})
	}

	await db.delete(album).where(eq(album.id, id))
	return new NextResponse(null, {status: 204})
}
