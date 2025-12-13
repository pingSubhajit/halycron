import React, {useMemo, useState} from 'react'
import {Text, View} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {Input} from '@/src/components/ui/input'
import {Image} from '@/src/components/interops'
import logo from '@halycron/ui/media/logo.svg'
import {authClient} from '@/src/lib/auth-client'
import {Platform} from 'react-native'

const ForgotPassword = () => {
	const {theme} = useTheme()
	const router = useRouter()

	const [email, setEmail] = useState('')
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)
	const [error, setError] = useState('')

	const redirectTo = useMemo(() => {
		/**
		 * Better Auth validates redirect URLs and will reject custom schemes like halycron:///...
		 * Use an HTTPS callback endpoint, which then redirects into the app deep link with token/error.
		 */
		const DEV_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000'
		const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL
		return `${BASE_URL}/api/auth/reset-password/callback`
	}, [])

	const handleSend = async () => {
		const trimmed = email.trim()
		if (!trimmed) {
			setError('Please enter your email address')
			return
		}

		try {
			setLoading(true)
			setError('')

			const result = await authClient.requestPasswordReset({
				email: trimmed,
				redirectTo
			} as never)

			// Never enumerate accounts: always show success.
			if (result?.error) {
				console.error('requestPasswordReset error:', result.error)
			}

			setSent(true)
		} catch (e) {
			console.error('requestPasswordReset failed:', e)
			setSent(true)
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

				{sent ? (
					<>
						<Text className="text-3xl font-bold mb-2 text-center text-white">Check your inbox</Text>
						<Text className="mb-10 text-center text-primary-foreground/80">
							If an account exists for that email, we just sent a secure reset link.
						</Text>

						<Button
							variant="default"
							onPress={() => router.push('/login')}
							className="mb-4 h-16"
						>
							<Text className="text-primary-foreground">Back to login</Text>
						</Button>
					</>
				) : (
					<>
						<Text className="text-3xl font-bold mb-2 text-center text-white">Reset your password</Text>
						<Text className="mb-12 text-center text-primary-foreground/80">
							Enter your email and we’ll send you a secure reset link.
						</Text>

						{error ? (
							<Text className="text-red-500 mb-4 text-center">{error}</Text>
						) : null}

						<View className="gap-4 mb-6">
							<Input
								className="h-16 px-6 text-primary-foreground"
								placeholder="Your email"
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
						</View>

						<Button
							variant="default"
							onPress={handleSend}
							className="mb-4 h-16"
							disabled={loading}
						>
							<Text className="text-primary-foreground">
								{loading ? 'Sending link...' : 'Send reset link'}
							</Text>
						</Button>

						<Button
							variant="outline"
							onPress={() => router.push('/login')}
							className="mb-4 h-16"
							disabled={loading}
						>
							<Text className="text-primary-foreground">Go back</Text>
						</Button>
					</>
				)}
			</View>
		</View>
	)
}

export default ForgotPassword


