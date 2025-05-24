import {Stack} from 'expo-router'
import React from 'react'
import {useSession} from '@/src/components/session-provider'
import {BiometricGuard} from '@/src/components/biometric-guard'

const AuthenticatedAppLayout = () => {
	const {session} = useSession()

	return (
		<BiometricGuard>
			<Stack
				screenOptions={{
					headerShown: false // Hides the header for all screens
					// animation: 'fade'
				}}
			>
				<Stack.Protected guard={!!session}>
					<Stack.Screen name="index"/>
					<Stack.Screen
						name="upload"
						options={{
							presentation: 'modal'
						}}
					/>
				</Stack.Protected>
			</Stack>
		</BiometricGuard>
	)
}

export default AuthenticatedAppLayout
