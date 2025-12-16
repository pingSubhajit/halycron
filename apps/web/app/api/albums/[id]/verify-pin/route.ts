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
// Token expiry should match server-side enforcement (5 minutes)
const TOKEN_EXPIRY = '5m'

export const POST = async (request: NextRequest, {params}: Props) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session) {
			return NextResponse.json({
				error: 'Unauthorized',
				verified: false
			}, {status: 401})
		}

		const {id} = await params
		const hasAccess = await checkAlbumAccess(id, session.user.id)
		if (!hasAccess) {
			return NextResponse.json({
				error: 'Album not found',
				verified: false
			}, {status: 404})
		}

		// Validate the PIN input
		const json = await request.json()
		const result = verifyPinSchema.safeParse(json)

		if (!result.success) {
			return NextResponse.json({
				error: 'Invalid PIN format',
				verified: false,
				formErrors: result.error.format()
			}, {status: 400})
		}

		// Verify the PIN against the stored hash
		const {pin} = result.data
		const isValid = await verifyAlbumPin(id, pin)

		if (!isValid) {
			return NextResponse.json({
				error: 'Incorrect PIN',
				verified: false
			}, {status: 400})
		}

		// Generate a JWT token for successful verification
		const token = jwt.sign(
			{
				albumId: id,
				userId: session.user.id,
				tokenType: 'album-access'
			},
			JWT_SECRET,
			{expiresIn: TOKEN_EXPIRY}
		)

		// Set expiry time for 5 minutes from now
		const expiryTime = new Date()
		expiryTime.setMinutes(expiryTime.getMinutes() + 5)

		// Create the success response
		const response = NextResponse.json({
			verified: true,
			accessToken: token,
			expiresAt: expiryTime.toISOString()
		})

		// IMPORTANT:
		// For mobile clients (Better Auth Expo client), persisting non-auth cookies via Set-Cookie
		// can overwrite the stored session cookie and effectively "log out" the app, causing 401s
		// on all subsequent requests. Mobile uses the returned accessToken via header instead.
		const isMobileClient = request.headers.get('x-app-platform') === 'Halycron-Mobile'

		if (!isMobileClient) {
			// Set the verification cookie for web
			response.cookies.set({
				name: `album-access-${id}`,
				value: token,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				path: '/',
				maxAge: 300 // 5 minutes in seconds
			})
		}

		return response
	} catch (error) {
		// Return error response
		return NextResponse.json({
			error: error instanceof Error ? error.message : 'Internal server error',
			verified: false
		}, {status: 500})
	}
}
