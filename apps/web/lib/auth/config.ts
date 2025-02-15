import {createAuthClient} from 'better-auth/react' // make sure to import from better-auth/react
import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {betterAuth} from 'better-auth'
import {nextCookies} from 'better-auth/next-js'
import {db} from '@/db/drizzle'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg' // or "mysql", "sqlite"
	}),
	emailAndPassword: {
		enabled: true
	},
	plugins: [nextCookies()]
})

export const authClient = createAuthClient({
	// you can pass client configuration here
})
