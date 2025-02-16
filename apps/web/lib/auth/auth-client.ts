import {createAuthClient} from 'better-auth/react' // make sure to import from better-auth/react
import {twoFactorClient} from 'better-auth/client/plugins'

export const authClient = createAuthClient({
	// you can pass client configuration here
	baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
	plugins: [
		twoFactorClient()
	]
})
