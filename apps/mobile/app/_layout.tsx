import React, {useEffect, useState} from 'react'
import {router, SplashScreen, Stack} from 'expo-router'
import CustomSplashScreen from '@/src/components/splash-screen'
import {ThemeProvider} from '@/src/theme/ThemeProvider'
import {SessionProvider, useSession} from '@/src/components/session-provider'
import {BiometricProvider} from '@/src/components/biometric-provider'
import {DialogProvider} from '@/src/components/dialog-provider'
import {QueryProvider} from '@/src/components/query-provider'
import {UploadProvider} from '@/src/components/upload-provider'
import {SystemBars} from 'react-native-edge-to-edge'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {useAppShareIntent} from '@/src/hooks/use-share-intent'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/src/lib/photo-keys'
import * as Notifications from 'expo-notifications'

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()
SystemBars.setStyle('light')

const ShareIntentHandler = () => {
	// Handle share intent at the top level
	useAppShareIntent({
		onSharedPhotosReceived: (photos) => {
			console.log(`Received ${photos.length} shared photos for upload`)
			// Navigate to upload screen when photos are shared
			router.push('/(app)/upload')
		}
	})
	return null
}

const NotificationHandler = () => {
	useEffect(() => {
		// Handle notification taps
		const subscription = Notifications.addNotificationResponseReceivedListener(response => {
			const data = response.notification.request.content.data

			// If it's any upload-related notification, navigate to upload screen
			if (data?.type === 'upload-progress' || data?.type === 'upload-complete' || data?.type === 'upload') {
				router.push('/(app)/upload')
			}
		})

		return () => subscription.remove()
	}, [])

	return null
}

const AppContent = () => {
	const queryClient = useQueryClient()

	return (
		<SessionProvider>
			<BiometricProvider>
				<DialogProvider>
					<UploadProvider
						onPhotoUploaded={(photo) => {
							// Invalidate queries to refresh the gallery
							queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
						}}
					>
						<ShareIntentHandler/>
						<NotificationHandler/>
						<SystemBars style="light"/>

						<RootNavigator/>
					</UploadProvider>
				</DialogProvider>
			</BiometricProvider>
		</SessionProvider>
	)
}

const AppLayout = () => {
	return (
		<GestureHandlerRootView style={{flex: 1}}>
			<QueryProvider>
				<ThemeProvider>
					<SafeAreaProvider>
						<AppContent/>
					</SafeAreaProvider>
				</ThemeProvider>
			</QueryProvider>
		</GestureHandlerRootView>
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
