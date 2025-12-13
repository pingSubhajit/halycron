import {createAuthClient} from 'better-auth/react' // make sure to import from better-auth/react
import {twoFactorClient} from 'better-auth/client/plugins'

interface TwoFactorClient {
	verifyTotp: (params: { code: string }) => Promise<any>;
	enable: (params: { password: string }) => Promise<any>;
}

interface ExtendedAuthClient extends ReturnType<typeof createAuthClient> {
	twoFactor: TwoFactorClient;
}

const envBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'
const baseURL = typeof window === 'undefined' ? envBaseURL : window.location.origin

export const authClient = createAuthClient({
	// you can pass client configuration here
	baseURL,
	fetchOptions: {
		credentials: 'include'
	},
	plugins: [
		twoFactorClient()
	]
}) as ExtendedAuthClient
