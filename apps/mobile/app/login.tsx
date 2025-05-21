import React, {useState} from 'react'
import {Alert, Text, TouchableOpacity, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {authClient} from '@/src/lib/auth-client'
import {Input} from '@/src/components/ui/input'
import logo from '@halycron/ui/media/logo.svg'
import {Image} from '@/src/components/interops'

const Login = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

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
				router.push('/two-factor')
				return
			}

			// Get the session immediately after login
			const session = await authClient.getSession()

			if (session.data) {
				router.push('/')
			} else {
				setError('Login succeeded but no session was created')
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
			<StatusBar style="dark"/>

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

				<Button
					variant="default"
					onPress={handleLogin}
					className="mb-4 h-16"
					disabled={loading}
				>
					<Text className="text-primary-foreground">{loading ? 'Getting you in...' : 'Welcome back'}</Text>
				</Button>

				<View className="flex-row justify-center">
					<Text className="text-primary-foreground/60">Don't have an account? </Text>
					<TouchableOpacity onPress={() => router.push('/onboarding')}>
						<Text className="text-primary font-medium">Create account</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	)
}

export default Login
