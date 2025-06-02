import React, {createContext, useContext, useEffect, useState} from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import {Alert} from 'react-native'

interface BiometricContextValue {
	isBiometricSupported: boolean;
	isEnrolled: boolean;
	biometricType: LocalAuthentication.AuthenticationType[];
	isAuthenticated: boolean;
	isLoading: boolean;
	authenticate: () => Promise<boolean>;
	isBiometricRequired: boolean;
}

const BiometricContext = createContext<BiometricContextValue | undefined>(undefined)

export const BiometricProvider = ({children}: { children: React.ReactNode }) => {
	const [isBiometricSupported, setIsBiometricSupported] = useState(false)
	const [isEnrolled, setIsEnrolled] = useState(false)
	const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType[]>([])
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		checkBiometricCapability()
	}, [])

	const checkBiometricCapability = async () => {
		try {
			const hasHardware = await LocalAuthentication.hasHardwareAsync()
			setIsBiometricSupported(hasHardware)

			if (hasHardware) {
				const isEnrolledResult = await LocalAuthentication.isEnrolledAsync()
				setIsEnrolled(isEnrolledResult)

				const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
				setBiometricType(supportedTypes)
			}
		} catch (error) {
			console.error('Error checking biometric capability:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const authenticate = async (): Promise<boolean> => {
		try {
			if (!isBiometricSupported || !isEnrolled) {
				Alert.alert(
					'Biometric Authentication Unavailable',
					'Biometric authentication is not available on this device or not enrolled.'
				)
				return false
			}

			const result = await LocalAuthentication.authenticateAsync({
				promptMessage: 'Unlock Halycron',
				fallbackLabel: 'Use Passcode'
			})

			if (result.success) {
				setIsAuthenticated(true)
				return true
			} else {
				return false
			}
		} catch (error) {
			console.error('Error during biometric authentication:', error)
			Alert.alert(
				'Authentication Error',
				'An error occurred during biometric authentication. Please try again.'
			)
			return false
		}
	}

	return (
		<BiometricContext.Provider
			value={{
				isBiometricSupported,
				isEnrolled,
				biometricType,
				isAuthenticated,
				isLoading,
				authenticate,
				isBiometricRequired: isBiometricSupported && isEnrolled
			}}
		>
			{children}
		</BiometricContext.Provider>
	)
}

export const useBiometric = () => {
	const context = useContext(BiometricContext)
	if (context === undefined) {
		throw new Error('useBiometric must be used within a BiometricProvider')
	}
	return context
}
