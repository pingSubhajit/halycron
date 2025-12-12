import {NextRequest, NextResponse} from 'next/server'
import {betterFetch} from '@better-fetch/fetch'
import {db} from '@/db/drizzle'
import {session, user} from '@/db/schema'
import {eq, desc} from 'drizzle-orm'

/**
 * Test endpoint to check if session is being recognized
 * This mimics what the middleware does
 */
export async function GET(request: NextRequest) {
	try {
		// Get the cookie from the request
		const cookie = request.headers.get('cookie') || ''
		
		// Extract the session token from the cookie
		const sessionTokenMatch = cookie.match(/better-auth\.session_token=([^;]+)/)
		const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null

		// Check if session exists in database directly
		let dbSession = null
		let dbUser = null
		let allSessions = null
		
		// Get most recent sessions to see what's in the table
		try {
			const sessions = await db
				.select({
					id: session.id,
					userId: session.userId,
					token: session.token,
					expiresAt: session.expiresAt,
					createdAt: session.createdAt
				})
				.from(session)
				.orderBy(desc(session.createdAt))
				.limit(10)
			
			allSessions = sessions.map(s => ({
				id: s.id?.substring(0, 10) + '...',
				userId: s.userId?.substring(0, 10) + '...',
				token: s.token?.substring(0, 15) + '...',
				expiresAt: s.expiresAt,
				createdAt: s.createdAt
			}))
		} catch (e) {
			allSessions = { error: String(e) }
		}
		
		if (sessionToken) {
			const [foundSession] = await db
				.select()
				.from(session)
				.where(eq(session.token, sessionToken))
				.limit(1)
			
			dbSession = foundSession
			
			if (foundSession) {
				const [foundUser] = await db
					.select()
					.from(user)
					.where(eq(user.id, foundSession.userId))
					.limit(1)
				dbUser = foundUser
			}
		}

		// Call the get-session endpoint just like the middleware does
		const {data: betterAuthSession, error} = await betterFetch<any>('/api/auth/get-session', {
			baseURL: request.nextUrl.origin,
			headers: {
				cookie: cookie
			}
		})

		// Also try raw fetch to see the actual response
		let rawResponse = null
		try {
			const rawFetch = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
				headers: {
					cookie: cookie
				}
			})
			rawResponse = {
				status: rawFetch.status,
				body: await rawFetch.text()
			}
		} catch (e) {
			rawResponse = { error: String(e) }
		}

		return NextResponse.json({
			cookieReceived: !!cookie,
			sessionTokenFound: !!sessionToken,
			sessionTokenValue: sessionToken?.substring(0, 10) + '...',
			
			// All sessions in database
			allSessionsInDb: allSessions,
			
			// Direct database lookup
			dbSessionExists: !!dbSession,
			dbSession: dbSession ? {
				id: dbSession.id,
				userId: dbSession.userId,
				token: dbSession.token?.substring(0, 10) + '...',
				expiresAt: dbSession.expiresAt,
				createdAt: dbSession.createdAt
			} : null,
			dbUserExists: !!dbUser,
			dbUser: dbUser ? {
				id: dbUser.id,
				email: dbUser.email,
				name: dbUser.name
			} : null,
			
			// Better-auth's response
			betterAuthSession: betterAuthSession || null,
			betterAuthError: error || null,
			
			// Raw response from get-session
			rawGetSessionResponse: rawResponse
		})
	} catch (error) {
		console.error('Test session error:', error)
		return NextResponse.json({
			error: String(error)
		}, {status: 500})
	}
}

