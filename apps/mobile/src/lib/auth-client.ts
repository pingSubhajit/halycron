import {createAuthClient} from 'better-auth/react'
import {expoClient} from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'
import {twoFactorClient} from 'better-auth/client/plugins'
import {Platform} from 'react-native'

// Custom user agent for Halycron mobile app
export const getCustomUserAgent = () => {
	return `Halycron-Mobile/${Platform.OS === 'ios' ? 'iOS' : 'Android'} (${Platform.Version}) Expo React-Native`
}

/*
 * For local development on iOS simulator or Android emulator
 * If using iOS simulator with a local server, use localhost
 * If using Android emulator with a local server, use 10.0.2.2 (Android's localhost equivalent)
 */
const DEV_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000'

// Use the proper API URL based on the environment
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL

export const authClient = createAuthClient({
	baseURL: BASE_URL, // Base URL of your Better Auth backend
	fetchOptions: {
		headers: {
			'User-Agent': getCustomUserAgent(),
			'X-Halycron-App': getCustomUserAgent(), // Backup header in case User-Agent is overridden
			'X-App-Version': Platform.OS === 'ios' ? 'iOS' : 'Android',
			'X-App-Platform': 'Halycron-Mobile'
		}
	},
	plugins: [
		expoClient({
			scheme: 'halycron', // Should match your app.json scheme
			storagePrefix: 'halycron',
			storage: SecureStore
		}),
		twoFactorClient()
	]
})
