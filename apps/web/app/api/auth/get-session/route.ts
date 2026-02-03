import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {db} from '@/db/drizzle'
import {session as sessionTable} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {getCookies} from 'better-auth/cookies'
import {getNewSessionExpiresAt, shouldRefreshSession} from '@/lib/auth/session-policy'

const getSessionCookieNameFromRequest = (request: NextRequest) => {
	const baseName = getCookies(auth.options).sessionToken.name

	const candidates = baseName.startsWith('__Secure-') || baseName.startsWith('__Host-')
		? [baseName]
		: [`__Secure-${baseName}`, `__Host-${baseName}`, baseName]

	return candidates.find((name) => request.cookies.get(name)?.value)
}

const toDate = (value: unknown): Date | null => {
	if (value instanceof Date) return value
	if (typeof value === 'number') return new Date(value)
	if (typeof value === 'string') {
		const ms = Date.parse(value)
		return Number.isFinite(ms) ? new Date(ms) : null
	}
	return null
}

/**
 * Override Better Auth's default `GET /api/auth/get-session` to implement rolling session expiry.
 *
 * Why: Several custom auth flows create DB sessions directly (previously hard-coded to 7 days),
 * and those sessions were not being extended on activity. This caused unexpected logouts
 * even when "auto-logout after inactivity" was disabled.
 */
export const GET = async (request: NextRequest) => {
	const session = await auth.api.getSession({headers: request.headers})
	if (!session) {
		return NextResponse.json(null)
	}

	const expiresAt = toDate((session as any)?.session?.expiresAt)
	if (!expiresAt) {
		// If we can't parse expiresAt, fall back to returning what we have.
		return NextResponse.json(session)
	}

	const nowMs = Date.now()
	let refreshedExpiresAt: Date | null = null

	if (shouldRefreshSession(expiresAt, nowMs)) {
		refreshedExpiresAt = getNewSessionExpiresAt(nowMs)

		await db.update(sessionTable).set({
			expiresAt: refreshedExpiresAt,
			updatedAt: new Date(nowMs)
		}).where(eq(sessionTable.id, (session as any).session.id))
	}

	const responseBody = refreshedExpiresAt
		? {
			...session,
			session: {
				...(session as any).session,
				expiresAt: refreshedExpiresAt
			}
		}
		: session

	const response = NextResponse.json(responseBody)

	// If we refreshed, also refresh the cookie expiry so clients that respect cookie expiry
	// (e.g., browsers, mobile cookie storage) don't drop the cookie early.
	if (refreshedExpiresAt) {
		const cookieName = getSessionCookieNameFromRequest(request)
		if (cookieName) {
			const cookieValue = request.cookies.get(cookieName)?.value
			if (cookieValue) {
				response.cookies.set({
					name: cookieName,
					value: cookieValue,
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					path: '/',
					expires: refreshedExpiresAt
				})
			}
		}
	}

	return response
}

