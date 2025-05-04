import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {user} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {z} from 'zod'

// Schema for validating the encryption key data
const encryptionKeySchema = z.object({
	encryptedUserKey: z.string(),
	userKeyIv: z.string(),
	userKeySalt: z.string()
})

/*
 * GET /api/user/encryption-key
 * Retrieves the user's encryption key
 */
export const GET = async () => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session?.user) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Get the user's encryption key from the database
		const userData = await db.query.user.findFirst({
			where: (users, {eq}) => eq(users.id, session.user.id),
			columns: {
				encryptedUserKey: true,
				userKeyIv: true,
				userKeySalt: true
			}
		})

		if (!userData || !userData.encryptedUserKey || !userData.userKeyIv || !userData.userKeySalt) {
			return NextResponse.json({
				encryptedUserKey: null,
				userKeyIv: null,
				userKeySalt: null
			})
		}

		return NextResponse.json({
			encryptedUserKey: userData.encryptedUserKey,
			userKeyIv: userData.userKeyIv,
			userKeySalt: userData.userKeySalt
		})
	} catch (error) {
		console.error('Error retrieving user encryption key:', error)
		return NextResponse.json(
			{error: 'Error retrieving user encryption key'},
			{status: 500}
		)
	}
}

/*
 * POST /api/user/encryption-key
 * Saves a new encryption key for the user
 */
export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session?.user) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body = await req.json()
		const result = encryptionKeySchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request body'},
				{status: 400}
			)
		}

		const {encryptedUserKey, userKeyIv, userKeySalt} = result.data

		// Update the user's encryption key in the database
		await db.update(user)
			.set({
				encryptedUserKey,
				userKeyIv,
				userKeySalt,
				updatedAt: new Date()
			})
			.where(eq(user.id, session.user.id))

		return NextResponse.json({success: true})
	} catch (error) {
		console.error('Error saving user encryption key:', error)
		return NextResponse.json(
			{error: 'Error saving user encryption key'},
			{status: 500}
		)
	}
}
