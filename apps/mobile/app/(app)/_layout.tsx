import {Stack} from 'expo-router'
import {View} from 'react-native'
import React from 'react'
import {useSession} from '@/src/components/session-provider'
import {BiometricGuard} from '@/src/components/biometric-guard'
import {TabBar} from '@/src/components/tab-bar'

const AuthenticatedAppLayout = () => {
	const {session} = useSession()

	return (
		<BiometricGuard>
			<View className="flex-1 bg-background">
				<Stack
					screenOptions={{
						headerShown: false, // Hides the header for all screens
						animation: 'fade'
					}}
				>
					<Stack.Protected guard={!!session}>
						<Stack.Screen name="index"/>
						<Stack.Screen name="albums"/>
						<Stack.Screen
							name="upload"
							options={{
								presentation: 'modal',
								animation: 'default'
							}}
						/>
					</Stack.Protected>
				</Stack>
				<TabBar/>
			</View>
		</BiometricGuard>
	)
}

export default AuthenticatedAppLayout
