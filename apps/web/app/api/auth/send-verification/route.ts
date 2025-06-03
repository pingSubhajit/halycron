import {NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {sendVerificationEmail} from '@/lib/email/resend-client'
import {db} from '@/db/drizzle'
import {verification} from '@/db/schema'
import crypto from 'crypto'

export const POST = async () => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Check if user is already verified
		if (session.user.emailVerified) {
			return NextResponse.json({error: 'Email is already verified'}, {status: 400})
		}

		// Generate verification token
		const token = crypto.randomBytes(32).toString('hex')
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

		// Store verification token in database
		await db.insert(verification).values({
			identifier: session.user.email,
			value: token,
			expiresAt
		})

		// Create verification URL
		const verificationUrl = `${process.env.BETTER_AUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(session.user.email)}`

		// Send verification email
		await sendVerificationEmail({
			to: session.user.email,
			verificationUrl,
			userName: session.user.name || undefined
		})

		return NextResponse.json({
			message: 'Verification email sent successfully',
			success: true
		})
	} catch (error) {
		console.error('Send verification email error:', error)
		return NextResponse.json(
			{error: 'Failed to send verification email'},
			{status: 500}
		)
	}
}
