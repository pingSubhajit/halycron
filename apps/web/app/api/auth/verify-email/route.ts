import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {user, verification} from '@/db/schema'
import {and, eq} from 'drizzle-orm'
import {z} from 'zod'

const requestSchema = z.object({
	token: z.string(),
	email: z.string().email()
})

export const POST = async (req: NextRequest) => {
	try {
		const body = await req.json()
		const result = requestSchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request data'},
				{status: 400}
			)
		}

		const {token, email} = result.data

		// Find the verification record
		const verificationRecord = await db
			.select()
			.from(verification)
			.where(
				and(
					eq(verification.identifier, email),
					eq(verification.value, token)
				)
			)
			.limit(1)

		if (verificationRecord.length === 0 || !verificationRecord[0]) {
			return NextResponse.json(
				{error: 'Invalid verification token'},
				{status: 400}
			)
		}

		const record = verificationRecord[0]

		// Check if the token has expired
		if (new Date() > record.expiresAt) {
			// Delete expired token
			await db
				.delete(verification)
				.where(eq(verification.id, record.id))

			return NextResponse.json(
				{error: 'Token expired'},
				{status: 400}
			)
		}

		// Update user's email verification status
		await db
			.update(user)
			.set({
				emailVerified: true,
				updatedAt: new Date()
			})
			.where(eq(user.email, email))

		// Delete the verification token (it's been used)
		await db
			.delete(verification)
			.where(eq(verification.id, record.id))

		return NextResponse.json({
			success: true,
			message: 'Email verified successfully'
		})
	} catch (error) {
		console.error('Email verification error:', error)
		return NextResponse.json(
			{error: 'Failed to verify email'},
			{status: 500}
		)
	}
}
