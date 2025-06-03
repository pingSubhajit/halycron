import {db} from '@/db/drizzle'
import {verification} from '@/db/schema'
import {eq, lt} from 'drizzle-orm'

/**
 * Cleans up expired verification tokens from the database
 * This should be called periodically to maintain database hygiene
 */
export const cleanupExpiredVerificationTokens = async () => {
	try {
		const result = await db
			.delete(verification)
			.where(lt(verification.expiresAt, new Date()))

		console.log('Cleaned up expired verification tokens')
		return {success: true, deletedCount: result.rowCount}
	} catch (error) {
		console.error('Failed to cleanup expired verification tokens:', error)
		return {success: false, error}
	}
}

/**
 * Deletes all verification tokens for a specific email
 * Useful when a user successfully verifies their email
 */
export const deleteVerificationTokensForEmail = async (email: string) => {
	try {
		const result = await db
			.delete(verification)
			.where(eq(verification.identifier, email))

		return {success: true, deletedCount: result.rowCount}
	} catch (error) {
		console.error('Failed to delete verification tokens for email:', error)
		return {success: false, error}
	}
}
