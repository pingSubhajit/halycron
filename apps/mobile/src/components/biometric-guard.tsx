import React, {useEffect, useState} from 'react'
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'
import {useBiometric} from './biometric-provider'
import * as LocalAuthentication from 'expo-local-authentication'
import fingerprint from '@halycron/ui/media/fingerprint.png'
import {Image} from '@/src/components/interops'
import {Button} from '@/src/components/ui/button'

interface BiometricGuardProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export const BiometricGuard = ({children, fallback}: BiometricGuardProps) => {
	const {
		biometricType,
		isAuthenticated,
		isLoading,
		authenticate,
		isBiometricRequired
	} = useBiometric()

	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const [shouldPromptOnMount, setShouldPromptOnMount] = useState(true)

	// Auto-prompt for biometric authentication when component mounts
	useEffect(() => {
		if (!isLoading && isBiometricRequired && !isAuthenticated && shouldPromptOnMount) {
			setShouldPromptOnMount(false)
			handleAuthenticate()
		}
	}, [isLoading, isBiometricRequired, isAuthenticated, shouldPromptOnMount])

	const handleAuthenticate = async () => {
		setIsAuthenticating(true)
		try {
			await authenticate()
		} catch (error) {
			console.error('Authentication error:', error)
		} finally {
			setIsAuthenticating(false)
		}
	}

	const getBiometricText = () => {
		if (biometricType.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
			return 'Face ID'
		} else if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
			return 'Touch ID'
		}
		return 'Biometric Authentication'
	}

	// Show loading state
	if (isLoading) {
		return (
			<View className="flex-1 bg-dark justify-center items-center p-6">
				<ActivityIndicator size="large" color="#8B5CF6"/>
				<Text style={styles.loadingText}>Checking biometric availability...</Text>
			</View>
		)
	}

	// If biometrics are not required, show the protected content
	if (!isBiometricRequired) {
		return <>{children}</>
	}

	// If authenticated, show the protected content
	if (isAuthenticated) {
		return <>{children}</>
	}

	// Show biometric authentication prompt
	return (
		<View className="flex-1 bg-dark justify-center items-center p-6 w-full max-w-sm">
			<View className="flex-1 justify-center items-center">
				<Image
					style={{width: 200, height: 200}}
					source={fingerprint}
					contentFit="contain"
				/>

				<Text className="text-xs text-white opacity-60 font-bold tracking-widest mb-4">
					AUTHENTICATION REQUIRED
				</Text>
				<Text className="text-3xl font-bold text-white text-center">Authentication required to access
					Halycron</Text>

				{fallback && (
					<View style={styles.fallbackContainer}>
						{fallback}
					</View>
				)}
			</View>

			<Button
				onPress={handleAuthenticate}
				className="h-16 w-full"
				disabled={isAuthenticating}
				style={{marginBottom: 32}}
			>
				{isAuthenticating ? (
					<ActivityIndicator size="small" color="#FFFFFF"/>
				) : (
					<Text style={styles.buttonText}>Authenticate</Text>
				)}
			</Button>
		</View>
	)
}

const styles = StyleSheet.create({
	subtitle: {
		fontSize: 16,
		color: '#A1A1AA',
		marginBottom: 32,
		textAlign: 'center',
		lineHeight: 22
	},
	button: {
		backgroundColor: '#8B5CF6',
		paddingHorizontal: 32,
		paddingVertical: 12,
		borderRadius: 8,
		minWidth: 140,
		alignItems: 'center'
	},
	buttonDisabled: {
		opacity: 0.6
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600'
	},
	loadingText: {
		color: '#A1A1AA',
		marginTop: 16,
		fontSize: 16
	},
	fallbackContainer: {
		marginTop: 24
	}
})
