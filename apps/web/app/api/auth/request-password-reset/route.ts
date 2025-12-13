import {NextRequest} from 'next/server'
import {auth} from '@/lib/auth/config'
import {toNextJsHandler} from 'better-auth/next-js'

const betterAuthHandler = toNextJsHandler(auth.handler)

export const POST = async (request: NextRequest) => {
	/**
	 * Mobile clients (React Native) often send no Origin/Referer headers, which triggers Better Auth CSRF checks.
	 * For genuine mobile requests (identified via our app headers), inject an Origin/Referer header and
	 * delegate to Better Auth's handler.
	 *
	 * We extract the origin from the request's `redirectTo` parameter (if provided) so that the injected
	 * origin matches what Better Auth validates against trustedOrigins.
	 */
	const appPlatform = request.headers.get('x-app-platform') || request.headers.get('x-halycron-app')
	const hasOrigin = Boolean(request.headers.get('origin') || request.headers.get('referer'))
	const isMobileClient = typeof appPlatform === 'string' && appPlatform.toLowerCase().includes('mobile')

	if (!isMobileClient || hasOrigin) {
		return betterAuthHandler.POST(request)
	}

	// Preserve body for Better Auth (request bodies are single-read)
	const bodyText = await request.clone().text()

	// Try to extract origin from redirectTo in the body so it matches Better Auth's validation
	let originToInject = request.nextUrl.origin
	try {
		const body = JSON.parse(bodyText)
		if (body.redirectTo) {
			originToInject = new URL(body.redirectTo).origin
		}
	} catch {
		// Fallback to server origin
	}

	const headers = new Headers(request.headers)
	headers.set('origin', originToInject)
	headers.set('referer', originToInject)

	// Recreate the request with injected headers
	const proxiedRequest = new NextRequest(request.url, {
		method: 'POST',
		headers,
		body: bodyText
	})

	return betterAuthHandler.POST(proxiedRequest)
}


