import {NextRequest, NextResponse} from 'next/server'
import {betterFetch} from '@better-fetch/fetch'
import {isQrSession, validateQrSession, QR_SESSION_PREFIX} from '../qr-login/utils'

/**
 * Custom session endpoint that handles both QR login sessions and regular sessions
 * QR login sessions are validated directly since better-auth doesn't recognize them
 * Regular sessions are forwarded to better-auth's get-session endpoint
 */
export async function GET(request: NextRequest) {
	try {
		const cookie = request.headers.get('cookie') || ''
		
		// Extract the session token from the cookie
		const sessionTokenMatch = cookie.match(/better-auth\.session_token=([^;]+)/)
		const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null

		// If it's a QR login session, validate it ourselves
		if (sessionToken && isQrSession(sessionToken)) {
			const qrSession = await validateQrSession(sessionToken)
			
			if (qrSession) {
				return NextResponse.json(qrSession)
			} else {
				return NextResponse.json(null)
			}
		}

		// For regular sessions, forward to better-auth
		const {data: session} = await betterFetch<any>('/api/auth/get-session', {
			baseURL: request.nextUrl.origin,
			headers: {
				cookie: cookie
			}
		})

		return NextResponse.json(session)
	} catch (error) {
		console.error('Session check error:', error)
		return NextResponse.json(null)
	}
}

