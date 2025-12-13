import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {userKeys} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {z} from 'zod'

const bodySchema = z.object({
	cryptoVersion: z.number().int().min(1).optional(),
	kdfSalt: z.string().min(1),
	kdfParams: z.string().min(1),
	wrappedUmkPw: z.string().min(1),
	wrappedUmkPwIv: z.string().min(1)
})

/**
 * Re-wrap UMK with a new password-derived KEK after password change/reset.
 * The client must have recovered/unwrapped UMK (via old password, recovery key, or trusted device)
 * and then generate a new wrappedUmkPw for the new password.
 */
export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const parsed = bodySchema.safeParse(await req.json())
		if (!parsed.success) {
			return NextResponse.json({error: 'Invalid request body'}, {status: 400})
		}

		const body = parsed.data

		const [updated] = await db.update(userKeys).set({
			...(body.cryptoVersion ? {cryptoVersion: body.cryptoVersion} : {}),
			kdfSalt: body.kdfSalt,
			kdfParams: body.kdfParams,
			wrappedUmkPw: body.wrappedUmkPw,
			wrappedUmkPwIv: body.wrappedUmkPwIv,
			updatedAt: new Date()
		}).where(eq(userKeys.userId, session.user.id)).returning()

		if (!updated) {
			return NextResponse.json({error: 'Keys not initialized'}, {status: 404})
		}

		return NextResponse.json({success: true})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}


