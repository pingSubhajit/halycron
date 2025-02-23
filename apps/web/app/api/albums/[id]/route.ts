import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {db} from '@/db/drizzle'
import {album} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {updateAlbumSchema} from '../types'
import {checkAlbumAccess, getAlbumWithPhotoCount, hashPin} from '../utils'
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

	const result = await getAlbumWithPhotoCount(params.id)
	if (!result) {
		return new NextResponse('Not Found', {status: 404})
	}

	return NextResponse.json(result)
}

export const PATCH = async (request: NextRequest, {params}: Props) => {
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
	const result = updateAlbumSchema.safeParse(json)

	if (!result.success) {
		return NextResponse.json(result.error.format(), {status: 400})
	}

	const {name, isSensitive, isProtected, pin} = result.data

	const updateData: any = {}
	if (name) updateData.name = name
	if (typeof isSensitive !== 'undefined') updateData.isSensitive = isSensitive
	if (typeof isProtected !== 'undefined') updateData.isProtected = isProtected
	if (pin) updateData.pinHash = hashPin(pin)

	const updatedAlbum = await db.update(album)
		.set(updateData)
		.where(eq(album.id, params.id))
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

	const hasAccess = await checkAlbumAccess(params.id, session.user.id)
	if (!hasAccess) {
		return new NextResponse('Not Found', {status: 404})
	}

	await db.delete(album).where(eq(album.id, params.id))
	return new NextResponse(null, {status: 204})
}
