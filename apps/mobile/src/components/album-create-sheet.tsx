import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
	ActivityIndicator,
	Keyboard,
	Pressable,
	Switch,
	Text,
	View
} from 'react-native'
import {TextInput} from 'react-native-gesture-handler'
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetScrollView,
	BottomSheetTextInput
} from '@gorhom/bottom-sheet'
import {useCreateAlbum} from '../hooks/use-albums'
import {Button} from './ui/button'
import {EyeOff} from '../../lib/icons/EyeOff'
import {Lock} from '../../lib/icons/Lock'
import {darkTheme} from '../theme/theme'


interface AlbumCreateSheetProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: () => void
}

export const AlbumCreateSheet: React.FC<AlbumCreateSheetProps> = ({
	isOpen,
	onClose,
	onSuccess
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const [name, setName] = useState('')
	const [isSensitive, setIsSensitive] = useState(false)
	const [isProtected, setIsProtected] = useState(false)
	const [pin, setPin] = useState('')
	const [error, setError] = useState('')

	const nameInputRef = useRef<TextInput>(null)
	const pinInputRef = useRef<TextInput>(null)

	const {mutate: createAlbum, isPending} = useCreateAlbum()

	// Snap points - use fixed height that accommodates both states
	const snapPoints = useMemo(() => ['55%'], [])

	// Reset form when sheet opens
	useEffect(() => {
		if (isOpen) {
			setName('')
			setIsSensitive(false)
			setIsProtected(false)
			setPin('')
			setError('')
			// Focus the name input after sheet animates in
			setTimeout(() => nameInputRef.current?.focus(), 300)
		}
	}, [isOpen])

	// Focus PIN input when protection is enabled
	useEffect(() => {
		if (isProtected && pin.length === 0) {
			setTimeout(() => {
				pinInputRef.current?.focus()
			}, 120)
		}
	}, [isProtected, pin.length])

	const handleCreate = useCallback(() => {
		// Validate
		if (!name.trim()) {
			setError('Please enter an album name')
			return
		}

		if (isProtected && pin.length !== 4) {
			setError('Please enter a 4-digit PIN')
			return
		}

		if (isProtected && !/^\d{4}$/.test(pin)) {
			setError('PIN must contain only numbers')
			return
		}

		Keyboard.dismiss()

		createAlbum(
			{
				name: name.trim(),
				isSensitive,
				isProtected,
				pin: isProtected ? pin : undefined
			},
			{
				onSuccess: () => {
					handleClose()
					onSuccess?.()
				},
				onError: (err) => {
					setError(err.message || 'Failed to create album')
				}
			}
		)
	}, [name, isSensitive, isProtected, pin, createAlbum, onSuccess])

	const handlePinChange = (text: string) => {
		// Only allow numbers and max 4 digits
		const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4)
		setPin(cleaned)
		if (error && cleaned.length === 4) {
			setError('')
		}
	}

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
				style={{flex: 1, paddingHorizontal: 20}}
				contentContainerStyle={{paddingBottom: 32}}
				keyboardShouldPersistTaps="handled"
			>
				{/* Header */}
				<View className="flex-row justify-between items-center mb-6 mt-2">
					<Text className="text-primary-foreground text-xl font-semibold">
						Create Album
					</Text>
					<Pressable
						onPress={handleClose}
						className="p-2 -mr-2"
						style={({pressed}) => ({opacity: pressed ? 0.6 : 1})}
					>
						<Text className="text-primary-foreground opacity-60 text-lg">✕</Text>
					</Pressable>
				</View>

				{/* Name Input - boxy design */}
				<View className="mb-5">
					<Text className="text-primary-foreground opacity-60 text-sm mb-2">
						Album Name
					</Text>
					<BottomSheetTextInput
						ref={nameInputRef}
						value={name}
						onChangeText={(text) => {
							setName(text)
							if (error) setError('')
						}}
						placeholder="Enter album name"
						placeholderTextColor={darkTheme.mutedForeground}
						style={{
							backgroundColor: darkTheme.muted,
							paddingHorizontal: 16,
							paddingVertical: 14,
							fontSize: 16,
							color: darkTheme.foreground,
							borderWidth: 1,
							borderColor: error && !name.trim() ? '#ef4444' : darkTheme.border
						}}
						returnKeyType="next"
						onSubmitEditing={() => {
							if (isProtected) {
								pinInputRef.current?.focus()
							} else {
								handleCreate()
							}
						}}
					/>
				</View>

				{/* Options - boxy design */}
				<View
					className="p-4 mb-5"
					style={{
						backgroundColor: darkTheme.muted,
						borderWidth: 1,
						borderColor: darkTheme.border
					}}
				>
					{/* Sensitive Toggle */}
					<View className="flex-row justify-between items-center mb-4">
						<View className="flex-row items-center flex-1">
							<EyeOff size={20} color={darkTheme.primary} />
							<View className="ml-3 flex-1">
								<Text className="text-primary-foreground text-base font-medium">
									Sensitive
								</Text>
								<Text className="text-primary-foreground opacity-60 text-xs mt-0.5">
									Hide photos from main gallery
								</Text>
							</View>
						</View>
						<Switch
							value={isSensitive}
							onValueChange={setIsSensitive}
							trackColor={{
								false: darkTheme.border,
								true: `${darkTheme.primary}80`
							}}
							thumbColor={isSensitive ? darkTheme.primary : darkTheme.mutedForeground}
						/>
					</View>

					{/* Protected Toggle */}
					<View className="flex-row justify-between items-center">
						<View className="flex-row items-center flex-1">
							<Lock size={20} color={darkTheme.primary} />
							<View className="ml-3 flex-1">
								<Text className="text-primary-foreground text-base font-medium">
									Protected
								</Text>
								<Text className="text-primary-foreground opacity-60 text-xs mt-0.5">
									Require 4-digit PIN to access
								</Text>
							</View>
						</View>
						<Switch
							value={isProtected}
							onValueChange={(value) => {
								setIsProtected(value)
								if (!value) setPin('')
							}}
							trackColor={{
								false: darkTheme.border,
								true: `${darkTheme.primary}80`
							}}
							thumbColor={isProtected ? darkTheme.primary : darkTheme.mutedForeground}
						/>
					</View>
				</View>

				{/* PIN Input - boxy design */}
				{isProtected && (
					<View className="mb-5">
						<Text className="text-primary-foreground opacity-60 text-sm mb-2">
							Set 4-digit PIN
						</Text>
						<Pressable
							onPress={() => pinInputRef.current?.focus()}
							style={{flexDirection: 'row', gap: 12, justifyContent: 'center'}}
						>
							{[0, 1, 2, 3].map((index) => (
								<View
									key={index}
									style={{
										width: 56,
										height: 56,
										backgroundColor: darkTheme.muted,
										justifyContent: 'center',
										alignItems: 'center',
										borderWidth: 2,
										borderColor:
											pin.length === index
												? darkTheme.primary
												: pin.length > index
													? darkTheme.primary + '40'
													: darkTheme.border
									}}
								>
									<Text className="text-primary-foreground text-2xl font-semibold">
										{pin[index] ? '•' : ''}
									</Text>
								</View>
							))}
						</Pressable>
						<BottomSheetTextInput
							ref={pinInputRef}
							value={pin}
							onChangeText={handlePinChange}
							keyboardType="number-pad"
							maxLength={4}
							style={{
								position: 'absolute',
								opacity: 0,
								width: '100%',
								height: 56,
								top: -1000
							}}
							onSubmitEditing={handleCreate}
						/>
					</View>
				)}

				{/* Error Message - boxy design */}
				{error ? (
					<View
						className="p-3 mb-5"
						style={{
							backgroundColor: '#ef444420',
							borderWidth: 1,
							borderColor: '#ef4444'
						}}
					>
						<Text className="text-center text-sm" style={{color: '#ef4444'}}>
							{error}
						</Text>
					</View>
				) : null}

				{/* Create Button - using Button component with cyan border */}
				<Button
					variant="default"
					onPress={handleCreate}
					disabled={isPending}
					className="h-14"
				>
					{isPending ? (
						<ActivityIndicator size="small" color={darkTheme.primary} />
					) : (
						<Text className="text-primary-foreground font-semibold text-base">
							Create Album
						</Text>
					)}
				</Button>
			</BottomSheetScrollView>
		</BottomSheet>
	)
}
