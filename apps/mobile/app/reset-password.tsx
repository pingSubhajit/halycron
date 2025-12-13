import React, {useMemo, useState} from 'react'
import {Text, View} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useLocalSearchParams, useRouter} from 'expo-router'
import {Input} from '@/src/components/ui/input'
import {Image} from '@/src/components/interops'
import logo from '@halycron/ui/media/logo.svg'
import {authClient} from '@/src/lib/auth-client'

const passwordMeetsPolicy = (password: string) => {
	// Mirror web password requirements: min 12 + upper/lower/number/special
	if (password.length < 12) return false
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[A-Za-z\d\W_]+$/.test(password)
}

const ResetPassword = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const {token, error} = useLocalSearchParams<{token?: string; error?: string}>()

	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [completed, setCompleted] = useState(false)
	const [message, setMessage] = useState('')

	const isValidLink = useMemo(() => {
		return Boolean(token) && !error
	}, [token, error])

	const handleReset = async () => {
		if (!token) {
			setMessage('This reset link is missing a token. Please request a new one.')
			return
		}

		if (!passwordMeetsPolicy(password)) {
			setMessage('Use at least 12 characters with upper/lowercase, a number, and a special character.')
			return
		}

		try {
			setLoading(true)
			setMessage('')

			const result = await authClient.resetPassword({
				newPassword: password,
				token
			} as never)

			if (result?.error) {
				throw result.error
			}

			setCompleted(true)
		} catch (e) {
			console.error('resetPassword failed:', e)
			setMessage('That link looks expired or invalid. Please request a fresh reset link.')
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

				{completed ? (
					<>
						<Text className="text-3xl font-bold mb-2 text-center text-white">Password updated</Text>
						<Text className="mb-10 text-center text-primary-foreground/80">
							You can now sign in with your new password.
						</Text>

						<Button
							variant="default"
							onPress={() => router.push('/login')}
							className="mb-4 h-16"
						>
							<Text className="text-primary-foreground">Back to login</Text>
						</Button>
					</>
				) : !isValidLink ? (
					<>
						<Text className="text-3xl font-bold mb-2 text-center text-white">Link not valid</Text>
						<Text className="mb-10 text-center text-primary-foreground/80">
							This reset link may have expired or already been used. Request a new one from the login screen.
						</Text>

						<Button
							variant="default"
							onPress={() => router.push('/forgot-password')}
							className="mb-4 h-16"
						>
							<Text className="text-primary-foreground">Request a new link</Text>
						</Button>

						<Button
							variant="outline"
							onPress={() => router.push('/login')}
							className="mb-4 h-16"
						>
							<Text className="text-primary-foreground">Back to login</Text>
						</Button>
					</>
				) : (
					<>
						<Text className="text-3xl font-bold mb-2 text-center text-white">Set a new password</Text>
						<Text className="mb-12 text-center text-primary-foreground/80">
							Choose a strong password to protect your vault.
						</Text>

						{message ? (
							<Text className="text-red-500 mb-4 text-center">{message}</Text>
						) : null}

						<View className="gap-4 mb-6">
							<Input
								className="h-16 px-6 text-primary-foreground"
								placeholder="New password"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
							/>
						</View>

						<Button
							variant="default"
							onPress={handleReset}
							className="mb-4 h-16"
							disabled={loading}
						>
							<Text className="text-primary-foreground">
								{loading ? 'Updating...' : 'Update password'}
							</Text>
						</Button>

						<Button
							variant="outline"
							onPress={() => router.push('/login')}
							className="mb-4 h-16"
							disabled={loading}
						>
							<Text className="text-primary-foreground">Back to login</Text>
						</Button>
					</>
				)}
			</View>
		</View>
	)
}

export default ResetPassword


