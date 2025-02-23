import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {db} from '@/db/drizzle'
import {album} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {createAlbumSchema} from './types'
import {hashPin} from './utils'
import {headers} from 'next/headers'

export const GET = async () => {
	const session = await auth.api.getSession({
		headers: await headers()
	})
	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const albums = await db.query.album.findMany({
		where: eq(album.userId, session.user.id),
		with: {
			photos: true
		}
	})

	return NextResponse.json(
		albums.map(album => ({
			id: album.id,
			name: album.name,
			isSensitive: album.isSensitive,
			isProtected: album.isProtected,
			createdAt: album.createdAt,
			updatedAt: album.updatedAt,
			_count: {
				photos: Object.keys(album.photos).length
			}
		}))
	)
}

export const POST = async (request: NextRequest) => {
	const session = await auth.api.getSession({
		headers: await headers()
	})
	if (!session) {
		return new NextResponse('Unauthorized', {status: 401})
	}

	const json = await request.json()
	const result = createAlbumSchema.safeParse(json)

	if (!result.success) {
		return NextResponse.json(result.error.format(), {status: 400})
	}

	const {name, isSensitive, isProtected, pin} = result.data

	if (isProtected && !pin) {
		return NextResponse.json({
			error: 'PIN is required for protected albums'
		}, {status: 400})
	}

	const newAlbum = await db.insert(album).values({
		name,
		userId: session.user.id,
		isSensitive,
		isProtected,
		pinHash: pin ? hashPin(pin) : null
	}).returning()

	return NextResponse.json(newAlbum[0])
}
