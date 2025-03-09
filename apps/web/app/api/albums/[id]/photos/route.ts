import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {photosToAlbums} from '@/db/schema'
import {and, eq, desc} from 'drizzle-orm'
import {generatePresignedDownloadUrl} from '@/lib/s3-client'
import jwt from 'jsonwebtoken'
import {cookies} from 'next/headers'

// Define the secret key for JWT
const JWT_SECRET = process.env.BETTER_AUTH_SECRET || 'album-protection-secret'

export const GET = async (request: NextRequest, {params}: {params: Promise<{id: string}>}) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Verify album ownership
		const {id} = await params
		const userAlbum = await db.query.album.findFirst({
			where: (albums, {and, eq}) => and(
				eq(albums.id, id),
				eq(albums.userId, session.user.id)
			)
		})

		if (!userAlbum) {
			return NextResponse.json({error: 'Album not found'}, {status: 404})
		}

		// Check if album is protected and verify access token
		if (userAlbum.isProtected) {
			// Get the album access token from cookies
			const accessToken = cookies().get(`album-access-${id}`)?.value

			// If no token, require verification
			if (!accessToken) {
				return NextResponse.json(
					{error: 'Protected album requires PIN verification', requiresPin: true}, 
					{status: 403}
				)
			}

			// Verify the token
			try {
				const decoded = jwt.verify(accessToken, JWT_SECRET) as {
					albumId: string;
					userId: string;
					tokenType: string;
				}

				// Check if token is valid for this album and user
				if (decoded.albumId !== id || decoded.userId !== session.user.id || decoded.tokenType !== 'album-access') {
					return NextResponse.json(
						{error: 'Invalid access token', requiresPin: true}, 
						{status: 403}
					)
				}
			} catch (error) {
				// Token is invalid or expired
				return NextResponse.json(
					{error: 'Access token expired', requiresPin: true}, 
					{status: 403}
				)
			}
		}

		// Get all photos in the album
		const albumPhotos = await db.query.photosToAlbums.findMany({
			where: eq(photosToAlbums.albumId, id),
			with: {
				photo: {
					with: {
						albums: {
							with: {
								album: true
							}
						}
					}
				}
			},
			orderBy: (photosToAlbums) => [desc(photosToAlbums.createdAt)]
		})

		const photosWithUrls = await Promise.all(albumPhotos.map(async (albumPhoto) => {
			const photo = albumPhoto.photo
			const url = await generatePresignedDownloadUrl(photo.s3Key)
			return {
				id: photo.id,
				url,
				originalFilename: photo.originalFilename,
				createdAt: photo.createdAt,
				encryptedFileKey: photo.encryptedFileKey,
				fileKeyIv: photo.fileKeyIv,
				mimeType: photo.mimeType,
				imageWidth: photo.imageWidth,
				imageHeight: photo.imageHeight,
				albums: photo.albums.map(photoAlbum => photoAlbum.album)
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

export const POST = async (req: NextRequest, {params}: {params: Promise<{id: string}>}) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {photoIds} = await req.json()

		// Verify album ownership
		const {id} = await params
		const userAlbum = await db.query.album.findFirst({
			where: (albums, {and, eq}) => and(
				eq(albums.id, id),
				eq(albums.userId, session.user.id)
			)
		})

		if (!userAlbum) {
			return NextResponse.json({error: 'Album not found'}, {status: 404})
		}

		// Add photos to album

		const photoAlbums = await db.insert(photosToAlbums)
			.values(photoIds.map((photoId: string) => ({
				albumId: id,
				photoId,
				createdAt: new Date()
			})))
			.returning()

		return NextResponse.json(photoAlbums)
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

export const DELETE = async (req: NextRequest, {params}: {params: Promise<{id: string}>}) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {photoIds} = await req.json()

		// Verify album ownership
		const {id} = await params
		const userAlbum = await db.query.album.findFirst({
			where: (albums, {and, eq}) => and(
				eq(albums.id, id),
				eq(albums.userId, session.user.id)
			)
		})

		if (!userAlbum) {
			return NextResponse.json({error: 'Album not found'}, {status: 404})
		}

		// Remove photos from album
		await db.delete(photosToAlbums)
			.where(and(
				eq(photosToAlbums.albumId, id),
				eq(photosToAlbums.photoId, photoIds[0])
			))

		return NextResponse.json({success: true})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
