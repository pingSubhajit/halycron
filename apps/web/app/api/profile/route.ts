import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {z} from 'zod'
import {db} from '@/db/drizzle'
import {user} from '@/db/schema'
import {headers} from 'next/headers'
import {eq} from 'drizzle-orm'

const updateProfileSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
	image: z.string().url().optional()
})

export const PATCH = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body = await req.json()
		const result = updateProfileSchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request body', details: result.error.format()},
				{status: 400}
			)
		}

		const updateData: Record<string, unknown> = {}
		if (result.data.name !== undefined) {
			updateData.name = result.data.name
		}
		if (result.data.image !== undefined) {
			updateData.image = result.data.image
		}

		updateData.updatedAt = new Date()

		// Update user in database
		const updatedUser = await db.update(user)
			.set(updateData)
			.where(eq(user.id, session.user.id))
			.returning()

		if (updatedUser.length === 0) {
			return NextResponse.json({error: 'User not found'}, {status: 404})
		}

		return NextResponse.json(updatedUser[0])
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
