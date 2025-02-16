import {betterFetch} from '@better-fetch/fetch'
import type {auth} from '@/lib/auth/config'
import {NextRequest, NextResponse} from 'next/server'

type Session = typeof auth.$Infer.Session

export const middleware = async (request: NextRequest) => {
	const {data: session} = await betterFetch<Session>('/api/auth/get-session', {
		baseURL: request.nextUrl.origin,
		headers: {
			cookie: request.headers.get('cookie') || '' // Forward the cookies from the request
		}
	})

	if (!session) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	if (!session.user.twoFactorEnabled) {
		return NextResponse.redirect(new URL('/register?twoFa=2fa', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/app/:path*'] // Specify the routes the middleware applies to
}
