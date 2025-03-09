import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {album, photosToAlbums} from '@/db/schema'
import {createAlbumSchema} from './types'
import {and, eq, count, sql} from 'drizzle-orm'
import {hashPin as secureHashPin} from '@/lib/auth/password'

export const GET = async () => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Get all albums for the user
		const albums = await db.query.album.findMany({
			where: (albums, {eq}) => eq(albums.userId, session.user.id),
			orderBy: (albums, {desc}) => [desc(albums.createdAt)]
		})

		// For each album, count the number of photos
		const albumsWithCounts = await Promise.all(
			albums.map(async (album) => {
				const photoCount = await db.select({
					count: count()
				})
					.from(photosToAlbums)
					.where(eq(photosToAlbums.albumId, album.id))
					.then(result => result[0]?.count || 0)

				return {
					...album,
					_count: {
						photos: photoCount
					}
				}
			})
		)

		return NextResponse.json(albumsWithCounts)
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body = await req.json()
		const result = createAlbumSchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request body', details: result.error.format()},
				{status: 400}
			)
		}

		const {name, isSensitive = false, isProtected = false, pin} = result.data

		// Ensure PIN is provided when album is protected
		if (isProtected && !pin) {
			return NextResponse.json(
				{error: 'PIN is required when album is protected'},
				{status: 400}
			)
		}

		// Hash the PIN if provided
		let pinHash = null
		if (isProtected && pin) {
			pinHash = await secureHashPin(pin)
		}

		// Save album to database
		const savedAlbum = await db.insert(album).values({
			userId: session.user.id,
			name,
			isSensitive,
			isProtected,
			pinHash
		}).returning()

		return NextResponse.json(savedAlbum[0])
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

// Add photos to album
export const PATCH = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {albumId, photoIds} = await req.json()

		// Verify album ownership
		const userAlbum = await db.query.album.findFirst({
			where: (albums, {and, eq}) => and(
				eq(albums.id, albumId),
				eq(albums.userId, session.user.id)
			)
		})

		if (!userAlbum) {
			return NextResponse.json({error: 'Album not found'}, {status: 404})
		}

		// Add photos to album
		const photoAlbums = await db.insert(photosToAlbums)
			.values(photoIds.map((photoId: string) => ({
				albumId,
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

// Remove photos from album
export const DELETE = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {albumId, photoIds} = await req.json()

		// Verify album ownership
		const userAlbum = await db.query.album.findFirst({
			where: (albums, {and, eq}) => and(
				eq(albums.id, albumId),
				eq(albums.userId, session.user.id)
			)
		})

		if (!userAlbum) {
			return NextResponse.json({error: 'Album not found'}, {status: 404})
		}

		// Remove photos from album
		await db.delete(photosToAlbums)
			.where(and(
				eq(photosToAlbums.albumId, albumId),
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
