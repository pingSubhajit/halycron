import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {user as userTable, account as accountTable, session as sessionTable, verification as verificationTable} from '@/db/schema'
import {eq, and} from 'drizzle-orm'
import {verifyPassword} from 'better-auth/crypto'

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
 * Email/Password Sign In Endpoint
 * Handles authentication for mobile apps by bypassing CSRF checks
 * 
 * This is a standalone route (not in better-auth handler) to avoid CSRF checks
 * which block requests without Origin headers (like mobile apps)
 */
export const POST = async (request: NextRequest) => {
	try {
		const body = await request.json()
		const {email, password} = body as {email: string; password: string}

		if (!email || !password) {
			return NextResponse.json(
				{error: 'Email and password are required'},
				{status: 400}
			)
		}

		// Find the user by email (try both original case and lowercase)
		let [user] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.email, email))
			.limit(1)

		// If not found, try lowercase
		if (!user) {
			[user] = await db
				.select()
				.from(userTable)
				.where(eq(userTable.email, email.toLowerCase()))
				.limit(1)
		}

		if (!user) {
			return NextResponse.json(
				{error: 'Invalid email or password'},
				{status: 401}
			)
		}

		// Get the credential account for this user (email/password)
		const [account] = await db
			.select()
			.from(accountTable)
			.where(
				and(
					eq(accountTable.userId, user.id),
					eq(accountTable.providerId, 'credential')
				)
			)
			.limit(1)

		if (!account || !account.password) {
			return NextResponse.json(
				{error: 'Invalid email or password'},
				{status: 401}
			)
		}

		// Verify the password using better-auth's built-in verification
		const isValidPassword = await verifyPassword({
			password,
			hash: account.password
		})

		if (!isValidPassword) {
			return NextResponse.json(
				{error: 'Invalid email or password'},
				{status: 401}
			)
		}

		// Check if two-factor is enabled
		if (user.twoFactorEnabled) {
			// Create a temporary verification token for 2FA
			// This token will be used to verify the user after 2FA
			const twoFactorToken = generateSecureToken(32)
			const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

			await db.insert(verificationTable).values({
				identifier: `two_factor_${twoFactorToken}`,
				value: user.id,
				expiresAt,
				createdAt: new Date(),
				updatedAt: new Date()
			})

			// Return a response indicating 2FA is required with the temp token
			return NextResponse.json({
				twoFactorRedirect: true,
				twoFactorToken,
				message: 'Two-factor authentication required'
			})
		}

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
		console.error('Error in email sign-in:', error)
		return NextResponse.json(
			{error: 'Failed to sign in'},
			{status: 500}
		)
	}
}

