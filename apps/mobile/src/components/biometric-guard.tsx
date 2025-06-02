import React, {useEffect, useState} from 'react'
import {ActivityIndicator, Text, View} from 'react-native'
import {useBiometric} from './biometric-provider'
import fingerprint from '@halycron/ui/media/fingerprint.png'
import {Image} from '@/src/components/interops'
import {Button} from '@/src/components/ui/button'
import {darkTheme} from '@/src/theme/theme'

interface BiometricGuardProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export const BiometricGuard = ({children, fallback}: BiometricGuardProps) => {
	const {
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

	// Show loading state
	if (isLoading) {
		return (
			<View className="flex-1 bg-dark justify-center items-center p-6">
				<ActivityIndicator size="large" color={darkTheme.primary}/>
				<Text className="text-muted-foreground mt-4">Checking biometric availability...</Text>
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
					<View className="mt-6">
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
					<Text className="text-primary-foreground font-semibold">Authenticate</Text>
				)}
			</Button>
		</View>
	)
}
