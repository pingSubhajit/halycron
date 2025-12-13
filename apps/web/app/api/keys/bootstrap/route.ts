import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {userKeys} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {z} from 'zod'

const bodySchema = z.object({
	cryptoVersion: z.number().int().min(1),
	kdfSalt: z.string().min(1),
	kdfParams: z.string().min(1), // JSON string
	wrappedUmkPw: z.string().min(1),
	wrappedUmkPwIv: z.string().min(1),
	wrappedUmkRk: z.string().min(1),
	wrappedUmkRkIv: z.string().min(1)
})

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

		const existing = await db.select({userId: userKeys.userId}).from(userKeys).where(eq(userKeys.userId, session.user.id)).limit(1)
		if (existing.length > 0) {
			return NextResponse.json({error: 'Keys already initialized'}, {status: 409})
		}

		const body = parsed.data
		const [created] = await db.insert(userKeys).values({
			userId: session.user.id,
			cryptoVersion: body.cryptoVersion,
			kdfSalt: body.kdfSalt,
			kdfParams: body.kdfParams,
			wrappedUmkPw: body.wrappedUmkPw,
			wrappedUmkPwIv: body.wrappedUmkPwIv,
			wrappedUmkRk: body.wrappedUmkRk,
			wrappedUmkRkIv: body.wrappedUmkRkIv,
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning()

		return NextResponse.json({
			success: true,
			createdAt: created?.createdAt
		})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}


