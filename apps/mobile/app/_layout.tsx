import React from 'react'
import {Stack} from 'expo-router'
import {ThemeProvider} from '@/src/theme/ThemeProvider'
import {SessionProvider} from '@/src/components/SessionProvider'

const AppLayout = () => {
	return (
		<ThemeProvider>
			<SessionProvider>
				<Stack
					screenOptions={{
						headerShown: false // Hides the header for all screens
					}}
				>
					<Stack.Screen name="index"/>
					<Stack.Screen name="onboarding"/>
					<Stack.Screen name="login"/>
					<Stack.Screen name="two-factor"/>
				</Stack>
			</SessionProvider>
		</ThemeProvider>
	)
}

export default AppLayout
