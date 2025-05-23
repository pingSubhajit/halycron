import {Stack} from 'expo-router'
import React from 'react'
import {useSession} from '@/src/components/session-provider'

const AuthenticatedAppLayout = () => {
	const {session} = useSession()

	return (
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
	)
}

export default AuthenticatedAppLayout
