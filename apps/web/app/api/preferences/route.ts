import {NextRequest, NextResponse} from 'next/server'
import {headers} from 'next/headers'
import {eq} from 'drizzle-orm'

import {db} from '@/db/drizzle'
import {userPreferences} from '@/db/schema'
import {auth} from '@/lib/auth/config'

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session?.user?.id) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		let prefs = await db.query.userPreferences.findFirst({
			where: eq(userPreferences.userId, session.user.id)
		})

		if (!prefs) {
			const [created] = await db.insert(userPreferences).values({
				userId: session.user.id,
				inactivityAutoLogoutEnabled: true
			}).returning()
			prefs = created
		}

		return NextResponse.json({
			inactivityAutoLogoutEnabled: prefs!.inactivityAutoLogoutEnabled
		})
	} catch (error) {
		console.error('Error fetching user preferences:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
}

export async function PUT(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session?.user?.id) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body = await request.json()
		const {preferenceId, enabled} = body ?? {}

		if (!preferenceId || typeof enabled !== 'boolean') {
			return NextResponse.json({error: 'Invalid request data'}, {status: 400})
		}

		const preferenceMap: Record<string, string> = {
			'inactivity-auto-logout': 'inactivityAutoLogoutEnabled'
		}

		const dbColumn = preferenceMap[preferenceId]
		if (!dbColumn) {
			return NextResponse.json({error: 'Invalid preference ID'}, {status: 400})
		}

		const existing = await db.query.userPreferences.findFirst({
			where: eq(userPreferences.userId, session.user.id)
		})

		if (!existing) {
			await db.insert(userPreferences).values({
				userId: session.user.id,
				inactivityAutoLogoutEnabled: preferenceId === 'inactivity-auto-logout' ? enabled : true
			})
		} else {
			const updateData: any = {}
			updateData[dbColumn] = enabled
			updateData.updatedAt = new Date()

			await db.update(userPreferences)
				.set(updateData)
				.where(eq(userPreferences.userId, session.user.id))
		}

		return NextResponse.json({success: true})
	} catch (error) {
		console.error('Error updating user preferences:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
}


