import {betterFetch} from '@better-fetch/fetch'
import type {auth} from '@/lib/auth/config'
import {NextRequest, NextResponse} from 'next/server'
import {rateLimit, RATE_LIMIT_CONFIGS, getRateLimitHeaders} from '@/lib/rate-limit'

type Session = typeof auth.$Infer.Session

export const middleware = async (request: NextRequest) => {
	// Apply rate limiting based on the route
	const path = request.nextUrl.pathname
	let rateLimitResult

	if (path.startsWith('/api/auth/reset-password')) {
		rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.passwordReset, 'reset')
	} else if (path.startsWith('/api/auth/sign-in')) {
		rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.login, 'login')
	} else if (path.startsWith('/api/')) {
		rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.standard, 'standard')
	}

	// If rate limit is exceeded, return 429 Too Many Requests
	if (rateLimitResult && !rateLimitResult.success) {
		return new NextResponse('Too Many Requests', {
			status: 429,
			headers: {
				...getRateLimitHeaders(rateLimitResult),
				'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
			},
		})
	}

	// For API routes that have rate limiting, add the headers to the response
	if (rateLimitResult && path.startsWith('/api/')) {
		const response = NextResponse.next()
		Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
			response.headers.set(key, value)
		})
		return response
	}

	// Continue with existing session checks for protected routes
	if (path.startsWith('/app/')) {
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
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/app/:path*',
		'/api/:path*'
	]
}
