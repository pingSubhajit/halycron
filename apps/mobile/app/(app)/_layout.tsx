import {router, Stack} from 'expo-router'
import {Platform, View} from 'react-native'
import React, {useEffect} from 'react'
import {useSession} from '@/src/components/session-provider'
import {BiometricGuard} from '@/src/components/biometric-guard'
import {TabBar} from '@/src/components/tab-bar'
import {uploadNotificationManager} from '@/src/lib/notification-utils'
import * as ScreenCapture from 'expo-screen-capture'
import {useCloseAllDialogs} from '@/src/components/dialog-provider'
import * as Linking from 'expo-linking'
import {VaultGate} from '@/src/components/vault-gate'

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
					closeAllDialogs()

					// Wait for dialogs to close before navigating
					setTimeout(() => {
						router.push(`/shared/${token}`)
					}, 400) // Increased delay to account for multiple close calls
				}
			}
		}

		/*
		 * Only handle subsequent deep links while app is running
		 * Initial deep links are handled in session provider for proper routing after auth
		 */
		const subscription = Linking.addEventListener('url', (event) => {
			handleDeepLink(event.url)
		})

		return () => subscription?.remove()
	}, [closeAllDialogs])

	return null
}

const AuthenticatedAppLayout = () => {
	const {session} = useSession()

	// Initialize notifications when app loads
	useEffect(() => {
		const initNotifications = async () => {
			await uploadNotificationManager.initialize()
		}
		initNotifications()
	}, [])

	useEffect(() => {
		// Avoid calling these on every render (can flood native bridge and freeze the app).
		const configureScreenCapture = async () => {
			try {
				await ScreenCapture.preventScreenCaptureAsync()
				if (process.env.EAS_BUILD_PROFILE === 'preview' || process.env.EAS_BUILD_PROFILE === 'development') {
					await ScreenCapture.allowScreenCaptureAsync()
				}
			} catch {
				// Best-effort only
			}
		}
		configureScreenCapture()
	}, [])

	return (
		<BiometricGuard>
			<VaultGate>
				<DeepLinkHandler/>

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
								name="album/[id]"
								options={{
									animation: 'slide_from_right',
									gestureEnabled: true,
									gestureDirection: 'horizontal',
									headerShown: false
								}}
							/>
							<Stack.Screen
								name="upload"
								options={{
									presentation: Platform.OS === 'android' ? 'fullScreenModal' : 'modal',
									animation: 'slide_from_bottom',
									animationDuration: 50,
									gestureEnabled: true,
									gestureDirection: 'vertical',
									headerShown: false
								}}
							/>

							<Stack.Screen
								name="qr-scanner"
								options={{
									presentation: 'fullScreenModal',
									animation: 'slide_from_bottom',
									gestureEnabled: true,
									gestureDirection: 'vertical',
									headerShown: false
								}}
							/>

							<Stack.Screen name="shared/[token]" options={{presentation: 'modal'}}/>
						</Stack.Protected>
					</Stack>
					<TabBar/>
				</View>
			</VaultGate>
		</BiometricGuard>
	)
}

export default AuthenticatedAppLayout
