import React, {useState} from 'react'
import {Text, View} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {authClient} from '@/src/lib/auth-client'
import {Input} from '@/src/components/ui/input'
import {Image} from '@/src/components/interops'
import logo from '@halycron/ui/media/logo.svg'

const TwoFactorScreen = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleVerify = async () => {
		if (!code || code.length < 6) {
			setError('Please enter a valid verification code')
			return
		}

		try {
			setLoading(true)
			setError('')

			// Verify 2FA code
			await authClient.twoFactor.verifyTotp({
				code
			})

			// Check session after verification
			const session = await authClient.getSession()

			if (session?.data?.user) {
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
