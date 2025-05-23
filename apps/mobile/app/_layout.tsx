import React, {useEffect, useState} from 'react'
import {SplashScreen, Stack} from 'expo-router'
import CustomSplashScreen from '@/src/components/splash-screen'
import {ThemeProvider} from '@/src/theme/ThemeProvider'
import {SessionProvider} from '@/src/components/session-provider'
import {DialogProvider} from '@/src/components/dialog-provider'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {StatusBar} from 'expo-status-bar'

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

const AppLayout = () => {
	const [initialRoute, setInitialRoute] = useState<string | null>(null)

	useEffect(() => {
		// Check auth state immediately on app load
		const checkAuthAndSetInitialRoute = async () => {
			try {
				// Check if we have a session stored
				const storedSession = await AsyncStorage.getItem('halycron_auth_session')

				setTimeout(() => {
					if (storedSession) {
						// Try to parse the session to check if it's valid
						const session = JSON.parse(storedSession)
						const expiresAt = session.expiresAt || 0

						if (Date.now() < expiresAt) {
							// Valid session, go home
							setInitialRoute('index')
						} else {
							// Expired session, go to onboarding
							setInitialRoute('onboarding')
						}
					} else {
						// No session, go to onboarding
						setInitialRoute('onboarding')
					}
				}, 1000)

				// Hide the splash screen once we've determined the route
				SplashScreen.hideAsync()
			} catch (error) {
				setInitialRoute('onboarding')
				SplashScreen.hideAsync()
			}
		}

		checkAuthAndSetInitialRoute()
	}, [])

	// Don't render anything until we've determined the initial route
	if (!initialRoute) {
		return <CustomSplashScreen/>
	}

	return (
		<ThemeProvider>
			<SessionProvider>
				<DialogProvider>
					<StatusBar style="light"/>

					<Stack
						initialRouteName={initialRoute}
						screenOptions={{
							headerShown: false, // Hides the header for all screens
							animation: 'fade'
						}}
					>
						<Stack.Screen name="onboarding"/>
						<Stack.Screen name="login"/>
						<Stack.Screen name="two-factor"/>
					</Stack>
				</DialogProvider>
			</SessionProvider>
		</ThemeProvider>
	)
}

export default AppLayout
