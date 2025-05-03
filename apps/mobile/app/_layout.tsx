import React from 'react'
import {Stack} from 'expo-router'
import {ThemeProvider} from '@/src/theme/ThemeProvider'

const AppLayout = () => {
	return (
		<ThemeProvider>
			<Stack
				screenOptions={{
					headerShown: false // Hides the header for all screens
				}}
			>
				<Stack.Screen name="index"/>
				<Stack.Screen name="onboarding"/>
				<Stack.Screen name="login"/>
			</Stack>
		</ThemeProvider>
	)
}

export default AppLayout
