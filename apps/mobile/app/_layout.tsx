import React, {useEffect, useState} from 'react'
import {router, Stack} from 'expo-router'
import {BackHandler, Platform} from 'react-native'
import CustomSplashScreen from '@/src/components/splash-screen'
import {ThemeProvider} from '@/src/theme/ThemeProvider'
import {SessionProvider, useSession} from '@/src/components/session-provider'
import {BiometricProvider} from '@/src/components/biometric-provider'
import {DialogProvider, useCloseAllDialogs} from '@/src/components/dialog-provider'
import {DialogRenderer} from '@/src/components/dialog-renderer'
import {QueryProvider} from '@/src/components/query-provider'
import {UploadProvider, useUploadContext} from '@/src/components/upload-provider'
import {SystemBars} from 'react-native-edge-to-edge'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {useAppShareIntent} from '@/src/hooks/use-share-intent'
import {useQuickActions} from '@/src/hooks/use-quick-actions'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/src/lib/photo-keys'
import * as Notifications from 'expo-notifications'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

// Splash screen fade animation
SplashScreen.setOptions({
	duration: 500,
	fade: true
})


SystemBars.setStyle('light')

const ShareIntentHandler = () => {
	// Handle share intent at the top level
	useAppShareIntent({
		onSharedPhotosReceived: (photos) => {
			// Navigate to upload screen when photos are shared
			router.push('/(app)/upload')
		}
	})
	return null
}

const QuickActionsHandler = () => {
	// Handle quick actions at the top level
	useQuickActions()
	return null
}

const NotificationHandler = () => {
	const {setUploadSource} = useUploadContext()

	useEffect(() => {
		// Handle notification taps
		const subscription = Notifications.addNotificationResponseReceivedListener(response => {
			const data = response.notification.request.content.data

			// If it's any upload-related notification, navigate to upload screen
			if (data?.type === 'upload-progress' || data?.type === 'upload-complete' || data?.type === 'upload') {
				setUploadSource('notification')
				router.push('/(app)/upload')
			}
		})

		return () => subscription.remove()
	}, [setUploadSource])

	return null
}

const DeepLinkHandler = () => {
	const {closeAllDialogs} = useCloseAllDialogs()

	useEffect(() => {
		// Handle deep links when app is opened from a link
		const handleDeepLink = (url: string) => {
			const parsed = Linking.parse(url)

			// Check if it's a shared link (either https://halycron.space or halycron:// scheme)
			const isHttpsSharedLink = parsed.hostname === 'halycron.space' && parsed.path?.startsWith('/shared/')
			const isCustomSchemeSharedLink = parsed.scheme === 'halycron' && parsed.path?.startsWith('/shared/')

			if (isHttpsSharedLink || isCustomSchemeSharedLink) {
				const token = parsed.path?.replace('/shared/', '')
				if (token) {
					console.log('🔗 Deep link detected while app running, navigating to:', `/shared/${token}`)

					// Close any open dialogs first to ensure shared content isn't hidden
					console.log('🔗 Calling closeAllDialogs() from deep link handler...')
					closeAllDialogs()

					/*
					 * Call closeAllDialogs multiple times to ensure it takes effect
					 * This handles edge cases with React state batching or timing
					 */
					setTimeout(() => {
						console.log('🔗 Calling closeAllDialogs() again after 50ms...')
						closeAllDialogs()
					}, 50)

					setTimeout(() => {
						console.log('🔗 Calling closeAllDialogs() again after 100ms...')
						closeAllDialogs()
					}, 100)

					// Navigate to shared route with replace to avoid stack issues
					setTimeout(() => {
						console.log('🔗 Navigating to shared route...')
						router.replace(`/shared/${token}`)
					}, 200)
				}
			}
		}

		/*
		 * Only handle subsequent deep links while app is running
		 * Initial URL is now handled by SessionProvider
		 */
		const subscription = Linking.addEventListener('url', (event) => {
			handleDeepLink(event.url)
		})

		return () => subscription?.remove()
	}, [closeAllDialogs])

	return null
}

const UploadCompletionHandler = () => {
	const {hasActiveUploads, uploadSource, setUploadSource} = useUploadContext()
	const [wasUploading, setWasUploading] = useState(false)

	useEffect(() => {
		// Track when uploads start
		if (hasActiveUploads && !wasUploading) {
			setWasUploading(true)
		}

		// Handle upload completion
		if (!hasActiveUploads && wasUploading) {
			setWasUploading(false)

			// If the upload was from share intent, navigate back to the original app
			if (uploadSource === 'share-intent') {
				// Reset upload source
				setUploadSource('manual')

				// Add a small delay to let the user see the completion, then exit app
				setTimeout(() => {
					try {
						if (Platform.OS === 'android') {
							// On Android, use BackHandler to exit the app
							BackHandler.exitApp()
						} else {
							/*
							 * On iOS, we can't force close the app, so we'll navigate to a minimal state
							 * and the user can tap the home button or swipe up
							 */
							router.dismissAll()
						}
					} catch (error) {
						// Fallback: navigate to home if we can't exit
						router.replace('/(app)')
					}
				}, 1500) // Give 1.5 seconds to see the completion
			}
		}
	}, [hasActiveUploads, wasUploading, uploadSource, setUploadSource])

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
						<QuickActionsHandler/>
						<NotificationHandler/>
						<DeepLinkHandler/>
						<UploadCompletionHandler/>
						<SystemBars style="light"/>

						<RootNavigator/>
					</UploadProvider>

					{/* Render dialogs outside the main content but inside the provider */}
					<DialogRenderer/>
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
			<Stack.Screen name="shared/[token]" options={{presentation: 'modal'}}/>
		</Stack>
	)
}
