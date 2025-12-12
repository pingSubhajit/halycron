import React, {useState} from 'react'
import {View, Text, ActivityIndicator} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {approveQrLogin, getQrLoginStatus} from '@/src/lib/qr-login-api'
import {CheckCircle2, XCircle, Monitor, Globe} from 'lucide-react-native'
import {useTheme} from '@/src/theme/ThemeProvider'

interface QrLoginConfirmProps {
	token: string
	onSuccess: () => void
	onCancel: () => void
	onError: (message: string) => void
}

type ConfirmState = 'loading' | 'confirming' | 'approving' | 'success' | 'error'

export const QrLoginConfirm = ({token, onSuccess, onCancel, onError}: QrLoginConfirmProps) => {
	const {theme} = useTheme()
	const [state, setState] = useState<ConfirmState>('loading')
	const [deviceInfo, setDeviceInfo] = useState<{ipAddress?: string; userAgent?: string} | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	// Load status info on mount
	React.useEffect(() => {
		const loadStatus = async () => {
			try {
				const status = await getQrLoginStatus(token)
				
				if (status.status !== 'pending') {
					setErrorMessage(`This QR code is ${status.status}`)
					setState('error')
					return
				}

				setDeviceInfo({
					ipAddress: status.ipAddress || undefined,
					userAgent: status.userAgent || undefined
				})
				setState('confirming')
			} catch (err) {
				setErrorMessage('Failed to load login request details')
				setState('error')
			}
		}

		loadStatus()
	}, [token])

	const handleApprove = async () => {
		setState('approving')
		
		try {
			const result = await approveQrLogin(token)
			
			if (result.success) {
				setState('success')
				// Small delay for success feedback
				setTimeout(onSuccess, 1500)
			} else {
				setErrorMessage(result.message || 'Failed to approve login')
				setState('error')
			}
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : 'Failed to approve login')
			setState('error')
		}
	}

	const handleCancel = () => {
		onCancel()
	}

	const handleRetry = () => {
		onError(errorMessage || 'An error occurred')
	}

	// Parse user agent for a friendly browser name
	const getBrowserName = (userAgent?: string): string => {
		if (!userAgent) return 'Unknown Browser'
		
		if (userAgent.includes('Chrome')) return 'Chrome'
		if (userAgent.includes('Safari')) return 'Safari'
		if (userAgent.includes('Firefox')) return 'Firefox'
		if (userAgent.includes('Edge')) return 'Edge'
		if (userAgent.includes('Opera')) return 'Opera'
		
		return 'Web Browser'
	}

	return (
		<View className="flex-1 justify-center items-center p-6 bg-background">
			{state === 'loading' && (
				<View className="items-center">
					<ActivityIndicator size="large" color={theme.primary} />
					<Text className="text-primary-foreground mt-4">Loading request details...</Text>
				</View>
			)}

			{state === 'confirming' && (
				<View className="items-center w-full max-w-sm">
					<View className="bg-primary/10 rounded-full p-6 mb-6">
						<Monitor size={48} color={theme.primary} />
					</View>
					
					<Text className="text-2xl font-bold text-primary-foreground text-center mb-2">
						Approve Login?
					</Text>
					<Text className="text-primary-foreground/70 text-center mb-8">
						Someone is trying to log in to Halycron on another device
					</Text>

					{deviceInfo && (
						<View className="w-full bg-card rounded-xl p-4 mb-8">
							<View className="flex-row items-center mb-3 gap-2">
								<Globe size={18} color={theme.mutedForeground} />
								<Text className="text-primary-foreground/70 ml-2">
									{getBrowserName(deviceInfo.userAgent)}
								</Text>
							</View>
							{deviceInfo.ipAddress && (
								<View className="flex-row items-center gap-2">
									<Monitor size={18} color={theme.mutedForeground} />
									<Text className="text-primary-foreground/70 ml-2">
										IP: {deviceInfo.ipAddress}
									</Text>
								</View>
							)}
						</View>
					)}

					<Text className="text-xs text-primary-foreground/70 text-center mb-6">
						Only approve if you initiated this login request
					</Text>

					<View className="w-full gap-3">
						<Button
							variant="default"
							onPress={handleApprove}
							className="h-14"
						>
							<Text className="text-primary-foreground font-semibold">Approve Login</Text>
						</Button>
						<Button
							variant="outline"
							onPress={handleCancel}
							className="h-14"
						>
							<Text className="text-primary-foreground">Cancel</Text>
						</Button>
					</View>
				</View>
			)}

			{state === 'approving' && (
				<View className="items-center">
					<ActivityIndicator size="large" color={theme.primary} />
					<Text className="text-primary-foreground mt-4">Approving login...</Text>
				</View>
			)}

			{state === 'success' && (
				<View className="items-center">
					<View className="bg-green-500/10 rounded-full p-6 mb-4">
						<CheckCircle2 size={64} color="#22c55e" />
					</View>
					<Text className="text-xl font-bold text-primary-foreground mb-2">Login Approved!</Text>
					<Text className="text-primary-foreground/70 text-center">
						The other device should now be logged in
					</Text>
				</View>
			)}

			{state === 'error' && (
				<View className="items-center w-full max-w-sm">
					<View className="bg-red-500/10 rounded-full p-6 mb-4">
						<XCircle size={64} color="#ef4444" />
					</View>
					<Text className="text-xl font-bold text-primary-foreground mb-2">Something went wrong</Text>
					<Text className="text-primary-foreground/70 text-center mb-6">
						{errorMessage}
					</Text>
					<View className="w-full gap-3">
						<Button
							variant="outline"
							onPress={handleRetry}
							className="h-14"
						>
							<Text className="text-primary-foreground">Try Again</Text>
						</Button>
						<Button
							variant="ghost"
							onPress={handleCancel}
							className="h-14"
						>
							<Text className="text-primary-foreground/70">Go Back</Text>
						</Button>
					</View>
				</View>
			)}
		</View>
	)
}

