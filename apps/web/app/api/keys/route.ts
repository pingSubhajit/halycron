import {NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {userKeys} from '@/db/schema'
import {eq} from 'drizzle-orm'

export const GET = async () => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const [row] = await db.select().from(userKeys).where(eq(userKeys.userId, session.user.id)).limit(1)
		if (!row) {
			return NextResponse.json({error: 'Keys not initialized'}, {status: 404})
		}

		return NextResponse.json({
			cryptoVersion: row.cryptoVersion,
			kdfSalt: row.kdfSalt,
			kdfParams: row.kdfParams,
			wrappedUmkPw: row.wrappedUmkPw,
			wrappedUmkPwIv: row.wrappedUmkPwIv,
			wrappedUmkRk: row.wrappedUmkRk,
			wrappedUmkRkIv: row.wrappedUmkRkIv,
			updatedAt: row.updatedAt
		})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}


