import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {
	user as userTable,
	session as sessionTable,
	verification as verificationTable,
	twoFactor as twoFactorTable
} from '@/db/schema'
import {eq, and, gt} from 'drizzle-orm'
import {symmetricDecrypt} from 'better-auth/crypto'
import {createOTP} from '@better-auth/utils/otp'
import {auth} from '@/lib/auth/config'
import {toNextJsHandler} from 'better-auth/next-js'
import {getCookies} from 'better-auth/cookies'
import {getNewSessionExpiresAt} from '@/lib/auth/session-policy'

const betterAuthHandler = toNextJsHandler(auth.handler)

/**
 * Generate a secure random token matching better-auth's format
 */
const generateSecureToken = (length: number): string => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	const array = new Uint8Array(length)
	crypto.getRandomValues(array)
	return Array.from(array, byte => chars[byte % chars.length]).join('')
}

/**
 * Sign a cookie value the same way Better Auth expects (`better-call`):
 * - compute HMAC-SHA256 over the raw token using BETTER_AUTH_SECRET
 * - append as `${token}.${base64(signature)}`
 * - encodeURIComponent() the whole value for safe cookie transport
 */
const signCookieValue = async (value: string, secret: string): Promise<string> => {
	const secretKey = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{name: 'HMAC', hash: 'SHA-256'},
		false,
		['sign']
	)
	const sigBuf = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(value))
	const signature = Buffer.from(sigBuf).toString('base64')
	return encodeURIComponent(`${value}.${signature}`)
}

/**
 * Two-Factor TOTP Verification Endpoint
 * Handles 2FA verification for mobile apps by bypassing CSRF checks
 * 
 * This is a standalone route (not in better-auth handler) to avoid CSRF checks
 * which block requests without Origin headers (like mobile apps)
 */
export const POST = async (request: NextRequest) => {
	try {
		// Read body from a clone so we can still forward the original request to Better Auth
		// (request bodies are single-read).
		const body = await request.clone().json().catch(() => ({}))
		const {code, twoFactorToken} = body as {code?: string; twoFactorToken?: string}

		/**
		 * IMPORTANT:
		 * This route exists to bypass CSRF for mobile apps (which may not send Origin headers),
		 * but it *must not* break the web flow.
		 *
		 * If no `twoFactorToken` is provided, delegate to Better Auth’s built-in handler
		 * for `/api/auth/two-factor/verify-totp`, which expects cookie-based sessions.
		 */
		if (!twoFactorToken) {
			return betterAuthHandler.POST(request)
		}

		if (!code) {
			return NextResponse.json(
				{error: 'Verification code is required'},
				{status: 400}
			)
		}

		// Find the verification record for this 2FA token
		const [verification] = await db
			.select()
			.from(verificationTable)
			.where(
				and(
					eq(verificationTable.identifier, `two_factor_${twoFactorToken}`),
					gt(verificationTable.expiresAt, new Date())
				)
			)
			.limit(1)

		if (!verification) {
			return NextResponse.json(
				{error: 'Invalid or expired two-factor token'},
				{status: 401}
			)
		}

		const userId = verification.value

		// Get the user
		const [user] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1)

		if (!user) {
			return NextResponse.json(
				{error: 'User not found'},
				{status: 404}
			)
		}

		// Get the 2FA secret
		const [twoFactorData] = await db
			.select()
			.from(twoFactorTable)
			.where(eq(twoFactorTable.userId, userId))
			.limit(1)

		if (!twoFactorData || !twoFactorData.secret) {
			return NextResponse.json(
				{error: 'Two-factor authentication not set up'},
				{status: 400}
			)
		}

		// Decrypt the secret using better-auth's method
		const secret = process.env.BETTER_AUTH_SECRET
		if (!secret) {
			console.error('BETTER_AUTH_SECRET not configured')
			return NextResponse.json(
				{error: 'Server configuration error'},
				{status: 500}
			)
		}

		let decryptedSecret: string
		try {
			decryptedSecret = await symmetricDecrypt({
				key: secret,
				data: twoFactorData.secret
			})
		} catch (error) {
			console.error('Failed to decrypt 2FA secret:', error)
			return NextResponse.json(
				{error: 'Failed to verify code'},
				{status: 500}
			)
		}

		// Verify the TOTP code using better-auth's OTP utility
		// This ensures we use the exact same verification algorithm
		const otp = createOTP(decryptedSecret, {
			period: 30,
			digits: 6
		})

		const isValidCode = await otp.verify(code)

		if (!isValidCode) {
			return NextResponse.json(
				{error: 'Invalid verification code'},
				{status: 401}
			)
		}

		// Delete the verification token (one-time use)
		await db
			.delete(verificationTable)
			.where(eq(verificationTable.id, verification.id))

		// Get request metadata
		const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
			|| request.headers.get('x-real-ip')
			|| ''
		const userAgent = request.headers.get('user-agent') || ''

		// Create session
		const expiresAt = getNewSessionExpiresAt()
		const sessionToken = generateSecureToken(32)

		const [session] = await db.insert(sessionTable).values({
			userId: user.id,
			token: sessionToken,
			expiresAt,
			ipAddress,
			userAgent,
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning()

		if (!session) {
			return NextResponse.json(
				{error: 'Failed to create session'},
				{status: 500}
			)
		}

		// This is the value that must be stored as the cookie value so `auth.api.getSession()`
		// can validate it via ctx.getSignedCookie().
		const signedSessionCookieValue = await signCookieValue(sessionToken, secret)
		const sessionCookieName = getCookies(auth.options).sessionToken.name

		return NextResponse.json({
			success: true,
			cookie: {
				// IMPORTANT: in production Better Auth may prefix cookies with "__Secure-"
				name: sessionCookieName,
				value: signedSessionCookieValue,
				expiresAt: session.expiresAt
			},
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image || null,
				emailVerified: user.emailVerified || false,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt
			},
			session: {
				id: session.id,
				userId: session.userId,
				token: sessionToken,
				expiresAt: session.expiresAt,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt
			},
			// Backwards compat (older clients stored this directly, which no longer works)
			token: sessionToken
		})
	} catch (error) {
		console.error('Error in 2FA verification:', error)
		return NextResponse.json(
			{error: 'Failed to verify code'},
			{status: 500}
		)
	}
}

