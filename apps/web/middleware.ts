import {betterFetch} from '@better-fetch/fetch'
import type {auth} from '@/lib/auth/config'
import {NextRequest, NextResponse} from 'next/server'
import {getSessionCookie} from 'better-auth'

type Session = typeof auth.$Infer.Session;

export const middleware = async (request: NextRequest) => {
	const sessionCookie = getSessionCookie(request) // Optionally pass config as the second argument if cookie name or prefix is customized.
	if (!sessionCookie) {
		return NextResponse.redirect(new URL('/', request.url))
	}
	return NextResponse.next()
}

export const config = {
	matcher: ['/app/:path*'] // Specify the routes the middleware applies to
}
