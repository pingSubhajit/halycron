import React, {useCallback, useRef, useState} from 'react'
import {Alert, Text, TouchableOpacity, View} from 'react-native'
import {TextInput} from 'react-native-gesture-handler'
import BottomSheet, {BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet'
import {darkTheme} from '@/src/theme/theme'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Lock} from '@/lib/icons/Lock'
import {Button} from '@/src/components/ui/button'
import {useVerifyPin} from '@/src/lib/shared-api'

interface SharedPinDialogProps {
	isOpen: boolean
	onClose: () => void
	token: string
	onPinVerified: () => void
}

export const SharedPinDialog: React.FC<SharedPinDialogProps> = ({
	isOpen,
	onClose,
	token,
	onPinVerified
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const pinInputRef = useRef<TextInput>(null)
	const [pin, setPin] = useState('')

	const verifyPinMutation = useVerifyPin()

	// Handle sheet close
	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close()
		setPin('')
		onClose()
	}, [onClose])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			handleClose()
		}
	}, [handleClose])

	// Handle PIN input
	const handlePinChange = (text: string) => {
		// Only allow digits and max 4 characters
		const cleaned = text.replace(/\D/g, '').slice(0, 4)
		setPin(cleaned)
	}

	// Focus PIN input
	const focusPinInput = useCallback(() => {
		pinInputRef.current?.focus()
	}, [])

	// Handle PIN verification
	const handleVerifyPin = useCallback(async () => {
		if (pin.length !== 4) {
			Alert.alert('Error', 'Please enter a 4-digit PIN')
			return
		}

		verifyPinMutation.mutate(
			{token, pin},
			{
				onSuccess: (response) => {
					if (response.isValid) {
						handleClose()
						onPinVerified()
					} else {
						Alert.alert('Error', 'Incorrect PIN. Please try again.')
						setPin('')
					}
				},
				onError: (error) => {
					const errorMessage = error instanceof Error ? error.message : 'Failed to verify PIN'
					Alert.alert('Error', errorMessage)
					setPin('')
				}
			}
		)
	}, [pin, token, verifyPinMutation, handleClose, onPinVerified])

	// Auto-focus PIN input when dialog opens
	React.useEffect(() => {
		if (isOpen && pinInputRef.current) {
			setTimeout(() => {
				pinInputRef.current?.focus()
			}, 100)
		}
	}, [isOpen])

	// Backdrop component
	const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				onPress={handleClose}
			/>
		),
		[handleClose]
	)

	// Don't render if not open
	if (!isOpen) {
		return null
	}

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={0}
			snapPoints={['50%']}
			onChange={handleSheetChanges}
			enablePanDownToClose={true}
			backgroundStyle={{backgroundColor: darkTheme.dark}}
			handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
			backdropComponent={renderBackdrop}
		>
			<BottomSheetView style={{flex: 1}}>
				<SafeAreaView style={{flex: 1, paddingHorizontal: 20, paddingBottom: 20}}>
					<View style={{alignItems: 'center', gap: 16, marginBottom: 32}}>
						<View style={{
							backgroundColor: '#171717',
							borderRadius: 50,
							padding: 16
						}}>
							<Lock size={32} color="white"/>
						</View>

						<Text style={{
							color: darkTheme.foreground,
							fontSize: 24,
							fontWeight: 'bold',
							textAlign: 'center'
						}}>
							Enter PIN
						</Text>

						<Text style={{
							color: darkTheme.mutedForeground,
							fontSize: 14,
							textAlign: 'center',
							lineHeight: 20
						}}>
							This content is protected. Please enter the 4-digit PIN to access it.
						</Text>
					</View>

					{/* PIN Input */}
					<View style={{alignItems: 'center', marginBottom: 32}}>
						<View style={{
							flexDirection: 'row',
							gap: 12,
							justifyContent: 'center'
						}}>
							{[0, 1, 2, 3].map((index) => (
								<TouchableOpacity
									key={index}
									onPress={focusPinInput}
									style={{
										width: 60,
										height: 60,
										backgroundColor: '#171717',
										borderRadius: 12,
										justifyContent: 'center',
										alignItems: 'center',
										borderWidth: 2,
										borderColor: pin.length > index ? darkTheme.accent : '#333'
									}}
								>
									<Text style={{
										color: darkTheme.foreground,
										fontSize: 24,
										fontWeight: 'bold'
									}}>
										{pin[index] ? '●' : ''}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Hidden input for PIN */}
						<BottomSheetTextInput
							ref={pinInputRef}
							value={pin}
							onChangeText={handlePinChange}
							keyboardType="numeric"
							maxLength={4}
							style={{
								position: 'absolute',
								opacity: 0,
								height: 1,
								width: 1,
								top: -1000
							}}
							autoComplete="off"
							textContentType="none"
							onSubmitEditing={handleVerifyPin}
						/>
					</View>

					{/* Action Buttons */}
					<View style={{gap: 12}}>
						<Button
							onPress={handleVerifyPin}
							disabled={verifyPinMutation.isPending || pin.length !== 4}
							variant="ghost"
							className="h-16 flex-row justify-center items-center"
						>
							<Text style={{
								color: 'white',
								fontSize: 16,
								fontWeight: '600'
							}}>
								{verifyPinMutation.isPending ? 'Verifying...' : 'Verify PIN'}
							</Text>
						</Button>

						<Button
							onPress={handleClose}
							variant="ghost"
							className="h-12 flex-row justify-center items-center"
						>
							<Text style={{
								color: darkTheme.mutedForeground,
								fontSize: 14
							}}>
								Cancel
							</Text>
						</Button>
					</View>
				</SafeAreaView>
			</BottomSheetView>
		</BottomSheet>
	)
}
