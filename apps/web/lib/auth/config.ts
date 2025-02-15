import {createAuthClient} from 'better-auth/react' // make sure to import from better-auth/react
import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {betterAuth} from 'better-auth'
import {nextCookies} from 'better-auth/next-js'
import {db} from '@/db/drizzle'
import * as schema from '@/db/schema'
import {twoFactor} from 'better-auth/plugins'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg', // or "mysql", "sqlite",
		schema
	}),
	emailAndPassword: {
		enabled: true
	},
	plugins: [
		nextCookies(),
		twoFactor()
	],
	advanced: {
		generateId: false
	},
	baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
})

export const authClient = createAuthClient({
	// you can pass client configuration here
})
