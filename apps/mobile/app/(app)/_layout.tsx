import {Stack} from 'expo-router'
import React from 'react'

const AuthenticatedAppLayput = () => {
	return (
		<Stack
			screenOptions={{
				headerShown: false, // Hides the header for all screens
				animation: 'fade'
			}}
		>
			<Stack.Screen name="index"/>
			<Stack.Screen
				name="upload"
				options={{
					presentation: 'modal'
				}}
			/>
		</Stack>
	)
}

export default AuthenticatedAppLayput
