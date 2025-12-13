import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {session as sessionTable} from '@/db/schema'
import {eq} from 'drizzle-orm'

/**
 * Sign Out Endpoint
 * Handles session invalidation for mobile apps by bypassing CSRF checks
 * 
 * This is a standalone route (not in better-auth handler) to avoid CSRF checks
 * which block requests without Origin headers (like mobile apps)
 */
export const POST = async (request: NextRequest) => {
	try {
		// Get the session token from the request
		// It could be in the Authorization header or in the request body
		let sessionToken: string | null = null

		// Check Authorization header first (Bearer token)
		const authHeader = request.headers.get('authorization')
		if (authHeader?.startsWith('Bearer ')) {
			sessionToken = authHeader.substring(7)
		}

		// If not in header, try to get from body
		if (!sessionToken) {
			try {
				const body = await request.json()
				sessionToken = body.token || body.sessionToken
			} catch {
				// Body might be empty, which is fine
			}
		}

		// Also check for cookie-based session (for web compatibility)
		if (!sessionToken) {
			const cookieHeader = request.headers.get('cookie')
			if (cookieHeader) {
				const cookies = cookieHeader.split(';').map(c => c.trim())
				const sessionCookie = cookies.find(c => c.startsWith('better-auth.session_token='))
				if (sessionCookie) {
					sessionToken = sessionCookie.split('=')[1] ?? null
				}
			}
		}

		if (!sessionToken) {
			return NextResponse.json(
				{error: 'No session token provided'},
				{status: 400}
			)
		}

		// Delete the session from the database
		const result = await db
			.delete(sessionTable)
			.where(eq(sessionTable.token, sessionToken))
			.returning()

		if (result.length === 0) {
			// Session not found, but we still return success
			// This handles cases where the session was already expired/deleted
			return NextResponse.json({
				success: true,
				message: 'Signed out successfully'
			})
		}

		// Create response with cookie clearing for web compatibility
		const response = NextResponse.json({
			success: true,
			message: 'Signed out successfully'
		})

		// Clear the session cookie (for web clients)
		response.cookies.set('better-auth.session_token', '', {
			expires: new Date(0),
			path: '/'
		})

		return response
	} catch (error) {
		console.error('Error in sign-out:', error)
		return NextResponse.json(
			{error: 'Failed to sign out'},
			{status: 500}
		)
	}
}

