import {createAuthClient} from 'better-auth/react' // make sure to import from better-auth/react
import {twoFactorClient} from 'better-auth/client/plugins'

interface TwoFactorClient {
	verifyTotp: (params: { code: string }) => Promise<any>;
	enable: (params: { password: string }) => Promise<any>;
}

interface ExtendedAuthClient extends ReturnType<typeof createAuthClient> {
	twoFactor: TwoFactorClient;
}

export const authClient = createAuthClient({
	// you can pass client configuration here
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
	plugins: [
		twoFactorClient()
	]
}) as ExtendedAuthClient
