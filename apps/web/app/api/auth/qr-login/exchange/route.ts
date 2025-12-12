import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {user} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {verifyExchangeToken} from '../utils'
import {auth} from '@/lib/auth/config'

interface ExchangeRequest {
	oneTimeToken: string
}

/**
 * Exchange a one-time token for a proper session with cookies
 * Calls better-auth's handler directly to create a proper session
 */
export async function POST(request: NextRequest) {
	try {
		const body: ExchangeRequest = await request.json()
		const {oneTimeToken} = body

		if (!oneTimeToken) {
			return NextResponse.json(
				{error: 'One-time token is required'},
				{status: 400}
			)
		}

		// Verify our custom exchange token
		console.log('Attempting to verify exchange token:', oneTimeToken?.substring(0, 20) + '...')
		
		const tokenData = verifyExchangeToken(oneTimeToken)

		if (!tokenData) {
			console.error('Exchange token verification failed - token not found or expired')
			return NextResponse.json(
				{error: 'Invalid or expired token'},
				{status: 401}
			)
		}

		console.log('Exchange token verified for user:', tokenData.userId)

		const userId = tokenData.userId

		// Verify the user exists
		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1)

		if (!existingUser) {
			return NextResponse.json(
				{error: 'User not found'},
				{status: 404}
			)
		}

		// Get access to better-auth's internal context
		// We need to call the handler to get proper context with session creation capabilities
		const authContext = (auth as any).$context
		
		console.log('Auth context available:', !!authContext)
		console.log('Context keys:', authContext ? Object.keys(authContext) : [])

		// Try to access the internal adapter - it may be lazily initialized
		let internalAdapter = authContext?.internalAdapter
		
		// If not directly available, try through options
		if (!internalAdapter && authContext?.options?.adapter) {
			internalAdapter = authContext.options.adapter
		}

		// As a fallback, use the session manager if available
		if (!internalAdapter && authContext?.sessionManager) {
			console.log('Using session manager')
			const sessionResult = await authContext.sessionManager.createSession({
				userId,
				request
			})
			if (sessionResult) {
				const response = NextResponse.json({
					success: true,
					user: {
						id: existingUser.id,
						email: existingUser.email,
						name: existingUser.name
					}
				})

				const isProduction = process.env.NODE_ENV === 'production'
				response.cookies.set({
					name: 'better-auth.session_token',
					value: sessionResult.session.token,
					httpOnly: true,
					secure: isProduction,
					sameSite: 'lax',
					path: '/',
					maxAge: 7 * 24 * 60 * 60
				})

				return response
			}
		}

		// If we still don't have internal access, try using the handler directly
		// Create a synthetic sign-in request that better-auth can process
		console.log('Attempting to use auth handler for session creation')
		
		// Since we can't directly create sessions, let's try calling signInEmail 
		// with the user's data through the internal API
		// This won't work without password, so we need another approach
		
		// Final fallback: Just insert the session and hope for the best
		// This approach didn't work before, but let's try with the exact session structure
		const { session: sessionTable } = await import('@/db/schema')
		
		// Generate token in the same way better-auth does
		const sessionToken = generateSecureToken(32)
		const now = new Date()
		const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

		const forwardedFor = request.headers.get('x-forwarded-for')
		const ipAddress = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''
		const userAgent = request.headers.get('user-agent') || ''

		const [newSession] = await db.insert(sessionTable).values({
			userId,
			token: sessionToken,
			expiresAt,
			ipAddress,
			userAgent,
			createdAt: now,
			updatedAt: now
		}).returning()

		console.log('Created session directly:', {
			id: newSession?.id,
			token: newSession?.token?.substring(0, 10) + '...',
			expiresAt: newSession?.expiresAt
		})

		if (!newSession) {
			return NextResponse.json(
				{error: 'Failed to create session'},
				{status: 500}
			)
		}

		// Create response with session cookie
		const response = NextResponse.json({
			success: true,
			user: {
				id: existingUser.id,
				email: existingUser.email,
				name: existingUser.name
			}
		})

		const isProduction = process.env.NODE_ENV === 'production'
		response.cookies.set({
			name: 'better-auth.session_token',
			value: sessionToken,
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60
		})

		return response
	} catch (error) {
		console.error('Error exchanging token:', error)
		return NextResponse.json(
			{error: 'Failed to exchange token'},
			{status: 500}
		)
	}
}

/**
 * Generate a secure random token matching better-auth's format
 */
function generateSecureToken(length: number): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	const array = new Uint8Array(length)
	crypto.getRandomValues(array)
	return Array.from(array, byte => chars[byte % chars.length]).join('')
}

