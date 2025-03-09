import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {verifyPinSchema} from '../../types'
import {checkAlbumAccess, verifyAlbumPin} from '../../utils'
import {headers} from 'next/headers'
import jwt from 'jsonwebtoken'
import {cookies} from 'next/headers'

interface Props {
  params: Promise<{
    id: string
  }>
}

// Define the secret key for JWT
const JWT_SECRET = process.env.BETTER_AUTH_SECRET || 'album-protection-secret'
// Set token expiry to 1 hour
const TOKEN_EXPIRY = '1h'

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

	// Create a JWT token for album access
	const token = jwt.sign(
		{
			albumId: id,
			userId: session.user.id,
			tokenType: 'album-access'
		}, 
		JWT_SECRET, 
		{ expiresIn: TOKEN_EXPIRY }
	)

	// Calculate expiry time
	const expiryTime = new Date()
	expiryTime.setHours(expiryTime.getHours() + 1) // 1 hour from now

	// Set a cookie with the token
	cookies().set({
		name: `album-access-${id}`,
		value: token,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/',
		expires: expiryTime
	})

	return NextResponse.json({
		verified: true,
		accessToken: token,
		expiresAt: expiryTime.toISOString()
	})
}
