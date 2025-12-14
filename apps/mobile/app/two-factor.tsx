import React, {useState} from 'react'
import {Text, View} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter, useLocalSearchParams} from 'expo-router'
import {Input} from '@/src/components/ui/input'
import {Image} from '@/src/components/interops'
import logo from '@halycron/ui/media/logo.svg'
import {useSession} from '@/src/components/session-provider'
import {Platform} from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Get the base URL for API calls
const DEV_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000'
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL

// SecureStore key for better-auth expo-client cookie storage
// Format: {storagePrefix}_cookie
const COOKIE_STORAGE_KEY = 'halycron_cookie'

const TwoFactorScreen = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const {twoFactorToken} = useLocalSearchParams<{twoFactorToken: string}>()
	const {setSessionData} = useSession()
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleVerify = async () => {
		if (!code || code.length < 6) {
			setError('Please enter a valid verification code')
			return
		}

		if (!twoFactorToken) {
			setError('Session expired. Please login again.')
			router.push('/login')
			return
		}

		try {
			setLoading(true)
			setError('')

			// Call our custom 2FA verification endpoint that bypasses CSRF
			const response = await fetch(`${BASE_URL}/api/auth/two-factor/verify-totp`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					code,
					twoFactorToken
				})
			})

			const data = await response.json()

			if (!response.ok) {
				setError(data.error || 'That code doesn\'t seem right. Let\'s try again?')
				return
			}

			// Set the session data from the response
			if (data.session && data.user) {
				// Store signed Better Auth cookie in SecureStore so api-client can authenticate `/api/*` calls.
				// Our server returns the signed cookie value in `data.cookie.value` (like QR login flow).
				const expiresAt = data?.cookie?.expiresAt ?? data?.session?.expiresAt
				const cookieName = data?.cookie?.name || 'better-auth.session_token'
				const cookieValue = data?.cookie?.value
				if (cookieValue) {
					const cookieData = {
						[cookieName]: {
							value: cookieValue,
							expires: new Date(expiresAt).toISOString()
						}
					}
					await SecureStore.setItemAsync(COOKIE_STORAGE_KEY, JSON.stringify(cookieData))
				}

				await setSessionData(data.session, data.user)
				router.push('/')
			} else {
				setError('That code doesn\'t seem right. Let\'s try again?')
			}
		} catch (err: any) {
			setError('That code doesn\'t seem right. Let\'s try again?')
		} finally {
			setLoading(false)
		}
	}

	return (
		<View
			className="flex-1 px-6"
			style={{backgroundColor: theme.background}}
		>
			<View className="flex-1 justify-center">
				<Image
					className="w-40 h-10 mb-7 mx-auto"
					source={logo}
					contentFit="contain"
				/>

				<Text className="text-3xl font-bold mb-2 text-center text-white">One Last Security Step</Text>
				<Text className="mb-12 text-center text-primary-foreground/80">Enter the 6-digit code from your
					authenticator app to confirm it's
					you</Text>

				{error ? (
					<Text className="text-red-500 mb-4 text-center">{error}</Text>
				) : null}

				<View className="mb-4">
					<Input
						className="h-16 text-center text-2xl text-primary-foreground"
						placeholder="000000"
						value={code}
						onChangeText={setCode}
						keyboardType="number-pad"
						maxLength={6}
					/>
				</View>

				<Button
					variant="default"
					onPress={handleVerify}
					className="mb-4 h-16"
					disabled={loading}
				>
					<Text className="text-primary-foreground">{loading ? 'Verifying...' : 'Let me in'}</Text>
				</Button>

				<Button
					variant="outline"
					onPress={() => router.push('/login')}
					className="mb-4 h-16"
				>
					<Text className="text-primary-foreground">Go back</Text>
				</Button>
			</View>
		</View>
	)
}

export default TwoFactorScreen
