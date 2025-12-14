import {db} from '@/db/drizzle'
import {session as sessionTable, user as userTable} from '@/db/schema'
import {eq, and, gt} from 'drizzle-orm'

export interface SessionUser {
	id: string
	name: string
	email: string
	emailVerified: boolean
	image: string | null
	twoFactorEnabled: boolean
	createdAt: Date | null
	updatedAt: Date | null
}

export interface SessionData {
	user: SessionUser
	session: {
		id: string
		userId: string
		token: string
		expiresAt: Date
	}
}

/**
 * Extracts and validates session from the Cookie header.
 * This is a fallback for when auth.api.getSession() doesn't work
 * (e.g., for mobile clients using the expo plugin).
 */
export async function getSessionFromCookie(headers: Headers): Promise<SessionData | null> {
	const cookieHeader = headers.get('cookie')
	if (!cookieHeader) {
		return null
	}

	// Parse the session token from cookies
	const cookies = cookieHeader.split(';').map(c => c.trim())
	// Better Auth may prefix cookies in production (e.g. __Secure-*) depending on cookie settings.
	const sessionCookie = cookies.find(c =>
		c.startsWith('better-auth.session_token=')
		|| c.startsWith('__Secure-better-auth.session_token=')
		|| c.startsWith('__Host-better-auth.session_token=')
	)
	
	if (!sessionCookie) {
		return null
	}

	const token = sessionCookie.split('=')[1]
	if (!token) {
		return null
	}

	// Look up the session in the database
	const sessionRecord = await db.query.session.findFirst({
		where: and(
			eq(sessionTable.token, token),
			gt(sessionTable.expiresAt, new Date())
		)
	})

	if (!sessionRecord) {
		return null
	}

	// Get the user
	const userRecord = await db.query.user.findFirst({
		where: eq(userTable.id, sessionRecord.userId)
	})

	if (!userRecord) {
		return null
	}

	return {
		user: {
			id: userRecord.id,
			name: userRecord.name,
			email: userRecord.email,
			emailVerified: userRecord.emailVerified ?? false,
			image: userRecord.image,
			twoFactorEnabled: userRecord.twoFactorEnabled ?? false,
			createdAt: userRecord.createdAt,
			updatedAt: userRecord.updatedAt
		},
		session: {
			id: sessionRecord.id,
			userId: sessionRecord.userId,
			token: sessionRecord.token,
			expiresAt: sessionRecord.expiresAt
		}
	}
}

