import React, {useState, useEffect} from 'react'
import {View, Text, StyleSheet, Alert} from 'react-native'
import {CameraView, useCameraPermissions, BarcodeScanningResult} from 'expo-camera'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useRouter} from 'expo-router'
import {Button} from '@/src/components/ui/button'
import {QrLoginConfirm} from '@/src/components/qr-login-confirm'
import {parseQrLoginUrl, isQrLoginUrl} from '@/src/lib/qr-login-api'
import {X, Camera, QrCode} from 'lucide-react-native'
import {useTheme} from '@/src/theme/ThemeProvider'

type ScannerState = 'scanning' | 'confirming' | 'permission_denied'

const QrScannerScreen = () => {
	const router = useRouter()
	const {theme} = useTheme()
	const [permission, requestPermission] = useCameraPermissions()
	const [state, setState] = useState<ScannerState>('scanning')
	const [scannedToken, setScannedToken] = useState<string | null>(null)
	const [hasScanned, setHasScanned] = useState(false)

	// Request permission on mount if not granted
	useEffect(() => {
		if (permission && !permission.granted && permission.canAskAgain) {
			requestPermission()
		}
	}, [permission, requestPermission])

	// Handle barcode scan
	const handleBarcodeScan = (result: BarcodeScanningResult) => {
		// Prevent multiple scans
		if (hasScanned) return

		const {data} = result
		
		// Check if it's a valid QR login URL
		if (isQrLoginUrl(data)) {
			const token = parseQrLoginUrl(data)
			if (token) {
				setHasScanned(true)
				setScannedToken(token)
				setState('confirming')
			}
		}
	}

	// Handle successful login approval
	const handleSuccess = () => {
		router.back()
	}

	// Handle cancel from confirmation
	const handleCancel = () => {
		setHasScanned(false)
		setScannedToken(null)
		setState('scanning')
	}

	// Handle error from confirmation
	const handleError = (message: string) => {
		Alert.alert('Error', message, [
			{text: 'OK', onPress: handleCancel}
		])
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

	// Showing confirmation dialog
	if (state === 'confirming' && scannedToken) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<QrLoginConfirm
					token={scannedToken}
					onSuccess={handleSuccess}
					onCancel={handleCancel}
					onError={handleError}
				/>
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
						<Text className="text-white font-semibold text-lg">Scan QR Code</Text>
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
					<View className="items-center pb-8 px-6">
						<View className="bg-black/50 rounded-xl p-4 items-center">
							<QrCode size={24} color="#fff" className="mb-2" />
							<Text className="text-white text-center">
								Point your camera at the QR code on the login page
							</Text>
						</View>
					</View>
				</SafeAreaView>
			</View>
		</View>
	)
}

export default QrScannerScreen

