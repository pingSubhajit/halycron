import React, {useEffect, useState} from 'react'
import {router, SplashScreen, Stack} from 'expo-router'
import CustomSplashScreen from '@/src/components/splash-screen'
import {ThemeProvider} from '@/src/theme/ThemeProvider'
import {SessionProvider, useSession} from '@/src/components/session-provider'
import {DialogProvider} from '@/src/components/dialog-provider'
import {QueryProvider} from '@/src/components/query-provider'
import {StatusBar} from 'expo-status-bar'

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

const AppLayout = () => {
	return (
		<QueryProvider>
			<ThemeProvider>
				<SessionProvider>
					<DialogProvider>
						<StatusBar style="light"/>

						<RootNavigator/>
					</DialogProvider>
				</SessionProvider>
			</ThemeProvider>
		</QueryProvider>
	)
}

export default AppLayout

const RootNavigator = () => {
	const {initialRoute} = useSession()
	const [hasNavigated, setHasNavigated] = useState(false)

	/*
	 * Don't render anything until we have the initial route
	 * The SessionProvider will show the splash screen
	 */
	if (!initialRoute) {
		return <CustomSplashScreen/>
	}

	// Handle initial navigation when initialRoute is determined
	useEffect(() => {
		if (initialRoute && !hasNavigated) {
			setHasNavigated(true)
			// Navigate immediately without delay since we're already sure about the route
			router.replace(initialRoute)
		}
	}, [initialRoute, hasNavigated])

	return (
		<Stack
			screenOptions={{
				headerShown: false, // Hides the header for all screens
				animation: 'fade'
			}}
		>
			<Stack.Screen name="onboarding"/>
			<Stack.Screen name="login"/>
			<Stack.Screen name="two-factor"/>
		</Stack>
	)
}
