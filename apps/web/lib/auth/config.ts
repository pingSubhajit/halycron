import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {betterAuth} from 'better-auth'
import {nextCookies} from 'better-auth/next-js'
import {db} from '@/db/drizzle'
import * as schema from '@/db/schema'
import {twoFactor} from 'better-auth/plugins'
import {twoFactorClient} from 'better-auth/client/plugins'

export const auth = betterAuth({
	appName: 'Halycon',
	database: drizzleAdapter(db, {
		provider: 'pg', // or "mysql", "sqlite",
		schema
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true
	},
	plugins: [
		nextCookies(),
		twoFactor(),
		twoFactorClient()
	],
	advanced: {
		generateId: false
	}
})
