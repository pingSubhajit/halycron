import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {privacySettings} from '@/db/schema'
import {auth} from '@/lib/auth/config'
import {eq} from 'drizzle-orm'
import {headers} from 'next/headers'

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session?.user?.id) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Get or create privacy settings for user
		let userSettings = await db.query.privacySettings.findFirst({
			where: eq(privacySettings.userId, session.user.id)
		})

		if (!userSettings) {
			// Create default settings
			const [newSettings] = await db.insert(privacySettings).values({
				userId: session.user.id,
				stripLocationData: false,
				anonymizeTimestamps: false,
				disableAnalytics: false,
				minimalServerLogs: true
			}).returning()
			userSettings = newSettings
		}

		return NextResponse.json({
			stripLocationData: userSettings!.stripLocationData,
			anonymizeTimestamps: userSettings!.anonymizeTimestamps,
			disableAnalytics: userSettings!.disableAnalytics,
			minimalServerLogs: userSettings!.minimalServerLogs
		})
	} catch (error) {
		console.error('Error fetching privacy settings:', error)
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
		const {settingId, enabled} = body

		if (!settingId || typeof enabled !== 'boolean') {
			return NextResponse.json({error: 'Invalid request data'}, {status: 400})
		}

		// Map frontend setting IDs to database columns
		const settingMap: Record<string, string> = {
			'strip-location': 'stripLocationData',
			'anonymize-timestamps': 'anonymizeTimestamps',
			'disable-analytics': 'disableAnalytics',
			'minimal-logs': 'minimalServerLogs'
		}

		const dbColumn = settingMap[settingId]
		if (!dbColumn) {
			return NextResponse.json({error: 'Invalid setting ID'}, {status: 400})
		}

		// Check if settings exist, create if not
		const existingSettings = await db.query.privacySettings.findFirst({
			where: eq(privacySettings.userId, session.user.id)
		})

		if (!existingSettings) {
			// Create with the updated setting
			await db.insert(privacySettings).values({
				userId: session.user.id,
				stripLocationData: settingId === 'strip-location' ? enabled : false,
				anonymizeTimestamps: settingId === 'anonymize-timestamps' ? enabled : false,
				disableAnalytics: settingId === 'disable-analytics' ? enabled : false,
				minimalServerLogs: settingId === 'minimal-logs' ? enabled : true
			})
		} else {
			// Update existing settings
			const updateData: any = {}
			updateData[dbColumn] = enabled
			updateData.updatedAt = new Date()

			await db.update(privacySettings)
				.set(updateData)
				.where(eq(privacySettings.userId, session.user.id))
		}

		return NextResponse.json({success: true})
	} catch (error) {
		console.error('Error updating privacy settings:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
} 