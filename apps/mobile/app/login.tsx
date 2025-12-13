import React, {useState} from 'react'
import {Alert, Text, TouchableOpacity, View} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {authClient} from '@/src/lib/auth-client'
import {Input} from '@/src/components/ui/input'
import logo from '@halycron/ui/media/logo.svg'
import {Image} from '@/src/components/interops'
import {useSession} from '@/src/components/session-provider'
import {useAuthRedirect} from '@/src/hooks/useAuthRedirect'
import {Feather} from '@expo/vector-icons'

const Login = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const {status} = useSession()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	// Redirect authenticated users to home
	useAuthRedirect({
		redirectAuthenticatedTo: '/'
	})

	const handleLogin = async () => {
		if (!email || !password) {
			setError('Please enter both email and password')
			return
		}

		try {
			setError('')
			setLoading(true)

			const result = await authClient.signIn.email({
				email,
				password
			})

			/*
			 * Check if two-factor authentication is required
			 * The result may include twoFactorRedirect even though it's not in the TypeScript type
			 */
			const resultData = result?.data as any
			if (resultData?.twoFactorRedirect) {
				// Pass the twoFactorToken to the 2FA screen
				router.push({
					pathname: '/two-factor',
					params: {twoFactorToken: resultData.twoFactorToken}
				})
				return
			}

			// Get the session immediately after login
			const session = await authClient.getSession()

			if (session.data) {
				router.push('/')
			} else {
				setError('That doesn\'t look right. Try again?')
			}
		} catch (err: any) {
			// Show a more detailed error
			setError(`Login failed: ${err?.message || 'Unknown error'}`)
			Alert.alert('Login Error', `Details: ${JSON.stringify(err)}`)
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

				<Text className="text-3xl font-bold mb-2 text-center text-white">Welcome back</Text>
				<Text className="mb-12 text-center text-primary-foreground/80">Enter your credentials to sign in to your
					account</Text>

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

					<Input
						className="h-16 px-6 text-primary-foreground"
						placeholder="Your password"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
					/>
				</View>

				<View className="flex-row justify-end mb-6">
					<TouchableOpacity onPress={() => router.push('/forgot-password')}>
						<Text className="text-primary font-medium">Forgot password?</Text>
					</TouchableOpacity>
				</View>

				<Button
					variant="default"
					onPress={handleLogin}
					className="mb-4 h-16"
					disabled={loading || status === 'loading'}
				>
					<Text className="text-primary-foreground">
						{loading ? 'Getting you in...' : status === 'loading' ? 'Loading...' : 'Welcome back'}
					</Text>
				</Button>

				<View className="flex-row justify-center">
					<Text className="text-primary-foreground/60">Don't have an account? </Text>
					<TouchableOpacity onPress={() => router.push('/onboarding')}>
						<Text className="text-primary font-medium">Create account</Text>
					</TouchableOpacity>
				</View>

				{/* Separator */}
				<View className="flex-row items-center my-6">
					<View className="flex-1 h-px bg-white/20" />
					<Text className="mx-4 text-primary-foreground/60 text-sm">or</Text>
					<View className="flex-1 h-px bg-white/20" />
				</View>

				{/* Scan QR to login button */}
				<TouchableOpacity
					onPress={() => router.push('/qr-login-scanner')}
					className="flex-row items-center justify-center py-4 border border-white/20 rounded-lg"
				>
					<Feather name="maximize" size={20} color="#fff" style={{marginRight: 8}} />
					<Text className="text-primary-foreground font-medium">Scan QR to login</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

export default Login
