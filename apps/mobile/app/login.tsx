import React, {useState} from 'react'
import {Text, TextInput, TouchableOpacity, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'

const Login = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const handleLogin = () => {
		// In a real app, we would handle authentication here
		router.push('/')
	}

	return (
		<View
			className="flex-1 px-6"
			style={{backgroundColor: theme.background}}
		>
			<StatusBar style="dark"/>

			<View className="flex-1 justify-center">
				<Text className="text-3xl font-bold mb-8 text-center">Log In</Text>

				<View className="space-y-4 mb-6">
					<View>
						<Text className="text-sm font-medium mb-1">Email</Text>
						<TextInput
							className="w-full border border-gray-300 rounded-lg p-3 bg-white"
							placeholder="Enter your email"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
					</View>

					<View>
						<Text className="text-sm font-medium mb-1">Password</Text>
						<TextInput
							className="w-full border border-gray-300 rounded-lg p-3 bg-white"
							placeholder="Enter your password"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
						/>
					</View>
				</View>

				<TouchableOpacity className="mb-6">
					<Text className="text-blue-600 text-right">Forgot Password?</Text>
				</TouchableOpacity>

				<Button
					variant="default"
					onPress={handleLogin}
					className="mb-4"
				>
					<Text>Log In</Text>
				</Button>

				<View className="flex-row justify-center">
					<Text className="text-gray-600">Don't have an account? </Text>
					<TouchableOpacity onPress={() => router.push('/onboarding')}>
						<Text className="text-blue-600 font-medium">Sign Up</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	)
}

export default Login
