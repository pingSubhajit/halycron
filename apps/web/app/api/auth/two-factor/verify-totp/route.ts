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
 * Two-Factor TOTP Verification Endpoint
 * Handles 2FA verification for mobile apps by bypassing CSRF checks
 * 
 * This is a standalone route (not in better-auth handler) to avoid CSRF checks
 * which block requests without Origin headers (like mobile apps)
 */
export const POST = async (request: NextRequest) => {
	try {
		const body = await request.json()
		const {code, twoFactorToken} = body as {code: string; twoFactorToken?: string}

		if (!code) {
			return NextResponse.json(
				{error: 'Verification code is required'},
				{status: 400}
			)
		}

		if (!twoFactorToken) {
			return NextResponse.json(
				{error: 'Two-factor token is required'},
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
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
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

		return NextResponse.json({
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

