import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {db} from '@/db/drizzle'
import {photo, photosToAlbums} from '@/db/schema'
import {and, eq, inArray} from 'drizzle-orm'
import {addPhotosToAlbumSchema} from '../../types'
import {addPhotosToAlbum, checkAlbumAccess, removePhotosFromAlbum} from '../../utils'
import {headers} from 'next/headers'

interface Props {
  params: {
    id: string
  }
}

export const GET = async (request: NextRequest, {params}: Props) => {
	const session = await auth.api.getSession({
		headers: await headers()
	})
	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const hasAccess = await checkAlbumAccess(params.id, session.user.id)
	if (!hasAccess) {
		return new NextResponse('Not Found', {status: 404})
	}

	const photos = await db.query.photo.findMany({
		where: eq(photosToAlbums.albumId, params.id),
		with: {
			albums: true
		}
	})

	return NextResponse.json(photos)
}

export const POST = async (request: NextRequest, {params}: Props) => {
	const session = await auth.api.getSession({
		headers: await headers()
	})
	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const hasAccess = await checkAlbumAccess(params.id, session.user.id)
	if (!hasAccess) {
		return new NextResponse('Not Found', {status: 404})
	}

	const json = await request.json()
	const result = addPhotosToAlbumSchema.safeParse(json)

	if (!result.success) {
		return NextResponse.json(result.error.format(), {status: 400})
	}

	const {photoIds} = result.data

	// Verify all photos belong to the user
	const userPhotos = await db.query.photo.findMany({
		where: and(
			eq(photo.userId, session.user.id),
			inArray(photo.id, photoIds)
		)
	})

	if (userPhotos.length !== photoIds.length) {
		return NextResponse.json({
			error: 'Some photos do not exist or do not belong to you'
		}, {status: 400})
	}

	await addPhotosToAlbum(params.id, photoIds)
	return new NextResponse(null, {status: 204})
}

export const DELETE = async (request: NextRequest, {params}: Props) => {
	const session = await auth.api.getSession({
		headers: await headers()
	})

	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const hasAccess = await checkAlbumAccess(params.id, session.user.id)
	if (!hasAccess) {
		return new NextResponse('Not Found', {status: 404})
	}

	const json = await request.json()
	const result = addPhotosToAlbumSchema.safeParse(json)

	if (!result.success) {
		return NextResponse.json(result.error.format(), {status: 400})
	}

	const {photoIds} = result.data
	await removePhotosFromAlbum(params.id, photoIds)
	return new NextResponse(null, {status: 204})
}
