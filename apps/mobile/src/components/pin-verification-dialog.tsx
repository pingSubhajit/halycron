import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
	ActivityIndicator,
	Keyboard,
	Pressable,
	Text,
	TextInput,
	View
} from 'react-native'
import BottomSheet, {BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming
} from 'react-native-reanimated'
import {useVerifyAlbumPin} from '../hooks/use-albums'
import {Lock} from '../../lib/icons/Lock'
import {darkTheme} from '../theme/theme'
import {Button} from './ui/button'

interface PinVerificationDialogProps {
	albumId: string
	isOpen: boolean
	onClose: () => void
	onVerified: () => void
}

export const PinVerificationDialog: React.FC<PinVerificationDialogProps> = ({
	albumId,
	isOpen,
	onClose,
	onVerified
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const [pin, setPin] = useState('')
	const [error, setError] = useState('')
	const [attempts, setAttempts] = useState(0)

	const pinInputRef = useRef<any>(null)
	const shakeAnimation = useSharedValue(0)

	const {mutate: verifyPin, isPending} = useVerifyAlbumPin()

	// Snap points
	const snapPoints = useMemo(() => ['50%'], [])

	// Reset state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setPin('')
			setError('')
			// Focus the PIN input after sheet animation
			setTimeout(() => {
				pinInputRef.current?.focus()
			}, 300)
		}
	}, [isOpen])

	const triggerShake = useCallback(() => {
		shakeAnimation.value = withSequence(
			withTiming(-10, {duration: 50}),
			withTiming(10, {duration: 50}),
			withTiming(-10, {duration: 50}),
			withTiming(10, {duration: 50}),
			withTiming(0, {duration: 50})
		)
	}, [shakeAnimation])

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{translateX: shakeAnimation.value}]
	}))

	const handleVerify = useCallback(() => {
		if (pin.length !== 4) {
			setError('Please enter your 4-digit PIN')
			return
		}

		Keyboard.dismiss()

		verifyPin(
			{albumId, pin},
			{
				onSuccess: (response) => {
					if (response.verified) {
						onVerified()
					} else {
						setError(response.error || 'Incorrect PIN')
						setPin('')
						setAttempts((prev) => prev + 1)
						triggerShake()
						setTimeout(() => {
							pinInputRef.current?.focus()
						}, 100)
					}
				},
				onError: (err) => {
					setError(err.message || 'Failed to verify PIN')
					setPin('')
					setAttempts((prev) => prev + 1)
					triggerShake()
					setTimeout(() => {
						pinInputRef.current?.focus()
					}, 100)
				}
			}
		)
	}, [pin, albumId, verifyPin, onVerified, triggerShake])

	const handlePinChange = (text: string) => {
		// Only allow numbers and max 4 digits
		const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4)
		setPin(cleaned)
		if (error) setError('')

		// Auto-submit when PIN is complete
		if (cleaned.length === 4) {
			// Small delay to show the last digit
			setTimeout(() => {
				Keyboard.dismiss()
				verifyPin(
					{albumId, pin: cleaned},
					{
						onSuccess: (response) => {
							if (response.verified) {
								onVerified()
							} else {
								setError(response.error || 'Incorrect PIN')
								setPin('')
								setAttempts((prev) => prev + 1)
								triggerShake()
								setTimeout(() => {
									pinInputRef.current?.focus()
								}, 100)
							}
						},
						onError: (err) => {
							setError(err.message || 'Failed to verify PIN')
							setPin('')
							setAttempts((prev) => prev + 1)
							triggerShake()
							setTimeout(() => {
								pinInputRef.current?.focus()
							}, 100)
						}
					}
				)
			}, 100)
		}
	}

	// Handle sheet close
	const handleClose = useCallback(() => {
		Keyboard.dismiss()
		bottomSheetRef.current?.close()
		onClose()
	}, [onClose])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			onClose()
		}
	}, [onClose])

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
	if (!isOpen) return null

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={0}
			snapPoints={snapPoints}
			onChange={handleSheetChanges}
			enablePanDownToClose={true}
			enableDynamicSizing={false}
			backgroundStyle={{backgroundColor: darkTheme.dark}}
			handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
			backdropComponent={renderBackdrop}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
		>
			<BottomSheetScrollView 
				style={{flex: 1}} 
				contentContainerStyle={{paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24}}
				keyboardShouldPersistTaps="handled"
			>
				{/* Header */}
				<View style={{alignItems: 'center', marginBottom: 24}}>
					<Lock size={24} color={darkTheme.primary} style={{marginBottom: 12}} />
					<Text style={{color: darkTheme.foreground, fontSize: 20, fontWeight: '600', textAlign: 'center'}}>
						Protected Album
					</Text>
				</View>

				{/* Description */}
				<Text style={{color: darkTheme.mutedForeground, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20}}>
					Enter your 4-digit PIN to unlock this album
				</Text>

				{/* PIN Input */}
				<Animated.View style={[{marginBottom: 24, position: 'relative'}, animatedStyle]}>
					<View style={{flexDirection: 'row', gap: 12, justifyContent: 'center'}}>
						{[0, 1, 2, 3].map((index) => (
							<View
								key={index}
								style={{
									width: 60,
									height: 60,
									backgroundColor: darkTheme.muted,
									justifyContent: 'center',
									alignItems: 'center',
									borderWidth: 2,
									borderColor:
										error
											? '#ef4444'
											: pin.length === index
												? darkTheme.primary
												: pin.length > index
													? darkTheme.primary + '40'
													: darkTheme.border
								}}
							>
								<Text style={{color: darkTheme.foreground, fontSize: 24, fontWeight: '600'}}>
									{pin[index] ? '•' : ''}
								</Text>
							</View>
						))}
					</View>
					{/* Invisible TextInput overlaying the PIN boxes */}
					<BottomSheetTextInput
						ref={pinInputRef}
						value={pin}
						onChangeText={handlePinChange}
						keyboardType="number-pad"
						maxLength={4}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: 60,
							opacity: 0
						}}
						editable={!isPending}
						caretHidden={true}
					/>
				</Animated.View>

				{/* Error Message */}
				{error ? (
					<View style={{padding: 12, marginBottom: 24, backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444'}}>
						<Text style={{color: '#ef4444', fontSize: 14, textAlign: 'center'}}>
							{error}
						</Text>
					</View>
				) : null}

				{/* Too many attempts warning */}
				{attempts >= 3 && (
					<View style={{padding: 12, marginBottom: 24, backgroundColor: `${darkTheme.primary}10`, borderWidth: 1, borderColor: darkTheme.border}}>
						<Text style={{color: darkTheme.mutedForeground, fontSize: 12, textAlign: 'center'}}>
							Multiple incorrect attempts detected. Please make sure you're entering the
							correct PIN.
						</Text>
					</View>
				)}

				{/* Loading indicator */}
				{isPending && (
					<View style={{alignItems: 'center', paddingVertical: 16}}>
						<ActivityIndicator size="large" color={darkTheme.primary} />
						<Text style={{color: darkTheme.mutedForeground, fontSize: 14, marginTop: 8}}>
							Verifying...
						</Text>
					</View>
				)}

				{/* Unlock Button */}
				<Button
					variant="default"
					onPress={handleVerify}
					disabled={isPending || pin.length !== 4}
					style={{height: 56}}
				>
					<Text style={{color: darkTheme.foreground, fontSize: 16, fontWeight: '600'}}>
						Unlock Album
					</Text>
				</Button>
			</BottomSheetScrollView>
		</BottomSheet>
	)
}
