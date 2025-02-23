import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {verifyPinSchema} from '../../types'
import {checkAlbumAccess, verifyAlbumPin} from '../../utils'
import {headers} from 'next/headers'

interface Props {
  params: Promise<{
    id: string
  }>
}

export const POST = async (request: NextRequest, {params}: Props) => {
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
	const result = verifyPinSchema.safeParse(json)

	if (!result.success) {
		return NextResponse.json(result.error.format(), {status: 400})
	}

	const {pin} = result.data
	const isValid = await verifyAlbumPin(id, pin)

	if (!isValid) {
		return NextResponse.json({
			error: 'Invalid PIN'
		}, {status: 400})
	}

	return NextResponse.json({success: true})
}
