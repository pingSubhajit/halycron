import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {betterAuth} from 'better-auth'
import {nextCookies} from 'better-auth/next-js'
import {db} from '@/db/drizzle'
import * as schema from '@/db/schema'
import {twoFactor} from 'better-auth/plugins'
import {twoFactorClient} from 'better-auth/client/plugins'
import {qrLoginPlugin} from './qr-login-plugin'
import {sendPasswordResetEmail} from '@/lib/email/resend-client'
import {SESSION_REFRESH_THRESHOLD_DAYS, SESSION_TTL_DAYS} from '@/lib/auth/session-policy'

export const auth: ReturnType<typeof betterAuth> = betterAuth({
	appName: 'Halycron',
	// In production, keep this strict (canonical origin). In development, allow requests from
	// the current dev host (e.g., LAN IP like http://192.168.x.x:3000) so redirectTo validation works.
	trustedOrigins: async (request: Request) => {
		const envBase = process.env.BETTER_AUTH_URL
		let envOrigin: string | undefined
		try {
			envOrigin = envBase ? new URL(envBase).origin : undefined
		} catch {
			envOrigin = undefined
		}

		if (process.env.NODE_ENV === 'production') {
			return Array.from(new Set([
				envOrigin,
				'https://halycron.space'
			].filter(Boolean) as string[]))
		}

		// In development, dynamically trust origins from request headers so LAN IPs work.
		const origins: string[] = []

		// 1. Server URL origin
		try {
			origins.push(new URL(request.url).origin)
		} catch { /* ignore */ }

		// 2. Origin header (client's actual origin)
		const originHeader = request.headers.get('origin')
		if (originHeader) {
			origins.push(originHeader)
		}

		// 3. Host / X-Forwarded-Host header (reconstruct origin)
		const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
		if (host) {
			const proto = request.headers.get('x-forwarded-proto') || 'http'
			origins.push(`${proto}://${host}`)
		}

		// 4. Referer header origin
		const referer = request.headers.get('referer')
		if (referer) {
			try {
				origins.push(new URL(referer).origin)
			} catch { /* ignore */ }
		}

		// Static dev origins
		origins.push('http://localhost:3000', 'http://10.0.2.2:3000')
		if (envOrigin) origins.push(envOrigin)

		return Array.from(new Set(origins.filter(Boolean)))
	},
	database: drizzleAdapter(db, {
		provider: 'pg', // or "mysql", "sqlite",
		schema
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({user, url}) => {
			await sendPasswordResetEmail({
				to: user.email,
				resetUrl: url,
				userName: user.name || undefined
			})
		},
		onPasswordReset: async ({user}) => {
			// Optional hook for security hardening / audit logging.
			console.log(`Password reset completed for user ${user.email}`)
		}
	},
	session: {
		// Defaults used to be ~7 days; keep users logged in for longer unless they explicitly sign out.
		// Values are in seconds.
		expiresIn: SESSION_TTL_DAYS * 24 * 60 * 60,
		updateAge: SESSION_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60
	},
	plugins: [
		nextCookies(),
		twoFactor(),
		twoFactorClient(),
		qrLoginPlugin()
	],
	advanced: {
		database: {
			generateId: false
		}
	}
})
