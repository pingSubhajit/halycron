import React, {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native'
import {CameraView, useCameraPermissions, BarcodeScanningResult} from 'expo-camera'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useRouter} from 'expo-router'
import {Button} from '@/src/components/ui/button'
import {parseMobileLoginUrl, isMobileLoginUrl} from '@/src/lib/qr-login-api'
import {useSession} from '@/src/components/session-provider'
import * as SecureStore from 'expo-secure-store'
import {X, Camera, CheckCircle} from 'lucide-react-native'
import {useTheme} from '@/src/theme/ThemeProvider'
import {Platform} from 'react-native'

type ScannerState = 'scanning' | 'processing' | 'success' | 'error' | 'permission_denied'

// SecureStore key for better-auth expo-client cookie storage
// Format: {storagePrefix}_cookie
const COOKIE_STORAGE_KEY = 'halycron_cookie'

const QrLoginScannerScreen = () => {
	const router = useRouter()
	const {theme} = useTheme()
	const {setSessionData} = useSession()
	const [permission, requestPermission] = useCameraPermissions()
	const [state, setState] = useState<ScannerState>('scanning')
	const [hasScanned, setHasScanned] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Request permission on mount if not granted
	useEffect(() => {
		if (permission && !permission.granted && permission.canAskAgain) {
			requestPermission()
		}
	}, [permission, requestPermission])

	// Handle barcode scan
	const handleBarcodeScan = async (result: BarcodeScanningResult) => {
		// Prevent multiple scans
		if (hasScanned) return

		const {data} = result

		// Check if it's a valid mobile login URL
		if (isMobileLoginUrl(data)) {
			const token = parseMobileLoginUrl(data)
			if (token) {
				setHasScanned(true)
				setState('processing')

				try {
					// Get the API URL
					const DEV_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000'
					const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL

					// Exchange the token for a session
					const response = await fetch(`${API_URL}/api/auth/qr-login/mobile-exchange`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({token})
					})

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						throw new Error(errorData.message || 'Failed to exchange token')
					}

					const responseData = await response.json()

					if (responseData.success && responseData.token && responseData.user && responseData.session) {
						// Convert expiresAt to timestamp if it's a string (for proper comparison)
						const expiresAt = typeof responseData.session.expiresAt === 'string'
							? new Date(responseData.session.expiresAt).getTime()
							: responseData.session.expiresAt

						// Store the session token in SecureStore in the correct format
						// The expo-client expects: { "cookie_name": { "value": "token", "expires": date } }
						const cookieData = {
							'better-auth.session_token': {
								value: responseData.token,
								expires: new Date(expiresAt).toISOString()
							}
						}
						await SecureStore.setItemAsync(COOKIE_STORAGE_KEY, JSON.stringify(cookieData))

						// Update session state via SessionProvider
						// This directly updates the context state so navigation works immediately
						const sessionToStore = {
							...responseData.session,
							expiresAt: expiresAt
						}
						await setSessionData(sessionToStore, responseData.user)

						setState('success')

						// Navigate to home after a brief delay
						setTimeout(() => {
							router.replace('/')
						}, 1500)
					} else {
						throw new Error(responseData.message || 'Failed to complete login')
					}
				} catch (err) {
					console.error('Error exchanging mobile login token:', err)
					setError(err instanceof Error ? err.message : 'Failed to complete login')
					setState('error')
				}
			}
		}
	}

	// Handle retry
	const handleRetry = () => {
		setHasScanned(false)
		setError(null)
		setState('scanning')
	}

	// Handle close button
	const handleClose = () => {
		router.back()
	}

	// Permission not determined yet
	if (!permission) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center">
				<Text className="text-primary-foreground">Loading camera...</Text>
			</SafeAreaView>
		)
	}

	// Permission denied
	if (!permission.granted) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
				<View className="bg-primary/10 rounded-full p-6 mb-6">
					<Camera size={48} color={theme.primary} />
				</View>
				<Text className="text-xl font-bold text-primary-foreground text-center mb-2">
					Camera Access Required
				</Text>
				<Text className="text-primary-foreground/70 text-center mb-8">
					To scan QR codes, we need access to your camera
				</Text>
				<View className="w-full max-w-sm gap-3">
					<Button
						variant="default"
						onPress={requestPermission}
						className="h-14"
					>
						<Text className="text-primary-foreground font-semibold">Grant Permission</Text>
					</Button>
					<Button
						variant="outline"
						onPress={handleClose}
						className="h-14"
					>
						<Text className="text-primary-foreground">Go Back</Text>
					</Button>
				</View>
			</SafeAreaView>
		)
	}

	// Processing state
	if (state === 'processing') {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
				<ActivityIndicator size="large" color={theme.primary} />
				<Text className="text-xl font-bold text-primary-foreground text-center mt-6 mb-2">
					Logging you in...
				</Text>
				<Text className="text-primary-foreground/70 text-center">
					Please wait while we verify your login
				</Text>
			</SafeAreaView>
		)
	}

	// Success state
	if (state === 'success') {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
				<View className="bg-green-500/20 rounded-full p-6 mb-6">
					<CheckCircle size={48} color="#22c55e" />
				</View>
				<Text className="text-xl font-bold text-primary-foreground text-center mb-2">
					Login Successful!
				</Text>
				<Text className="text-primary-foreground/70 text-center">
					Redirecting to your photos...
				</Text>
			</SafeAreaView>
		)
	}

	// Error state
	if (state === 'error') {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
				<Text className="text-xl font-bold text-primary-foreground text-center mb-2">
					Login Failed
				</Text>
				<Text className="text-red-500 text-center mb-8">
					{error || 'Something went wrong. Please try again.'}
				</Text>
				<View className="w-full max-w-sm gap-3">
					<Button
						variant="default"
						onPress={handleRetry}
						className="h-14"
					>
						<Text className="text-primary-foreground font-semibold">Try Again</Text>
					</Button>
					<Button
						variant="outline"
						onPress={handleClose}
						className="h-14"
					>
						<Text className="text-primary-foreground">Go Back</Text>
					</Button>
				</View>
			</SafeAreaView>
		)
	}

	// Scanning state
	return (
		<View className="flex-1 bg-black">
			<CameraView
				style={StyleSheet.absoluteFillObject}
				facing="back"
				barcodeScannerSettings={{
					barcodeTypes: ['qr']
				}}
				onBarcodeScanned={hasScanned ? undefined : handleBarcodeScan}
			/>

			{/* Overlay */}
			<View style={StyleSheet.absoluteFillObject}>
				{/* Header */}
				<SafeAreaView edges={['top']}>
					<View className="flex-row items-center justify-between px-4 py-2">
						<Button
							variant="ghost"
							onPress={handleClose}
							className="w-10 h-10 rounded-full bg-black/30"
						>
							<X size={24} color="#fff" />
						</Button>
						<Text className="text-white font-semibold text-lg">Scan to Login</Text>
						<View className="w-10" />
					</View>
				</SafeAreaView>

				{/* Scanner frame */}
				<View className="flex-1 items-center justify-center">
					<View className="w-64 h-64 relative">
						{/* Corner borders */}
						<View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
						<View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
						<View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
						<View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />
					</View>
				</View>

				{/* Instructions */}
				<SafeAreaView edges={['bottom']}>
					<View className="items-center pb-8 px-6 mb-24">
						<View className="bg-black/50 rounded-xl p-4 items-center">
							<Text className="text-white text-center">
								Scan the QR code shown on the web app to login instantly
							</Text>
						</View>
					</View>
				</SafeAreaView>
			</View>
		</View>
	)
}

export default QrLoginScannerScreen

