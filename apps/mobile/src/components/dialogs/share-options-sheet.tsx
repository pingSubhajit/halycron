import React, {useCallback, useMemo, useRef, useState} from 'react'
import {ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native'
import {TextInput} from 'react-native-gesture-handler'
import BottomSheet, {BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet'
import {Image} from 'expo-image'
import {CreateShareLinkRequest, ExpiryOption, Photo} from '@/src/lib/types'
import {darkTheme} from '@/src/theme/theme'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Share} from '@/lib/icons/Share'
import {Link} from '@/lib/icons/Link'
import {ExternalLink} from '@/lib/icons/ExternalLink'
import {Copy} from '@/lib/icons/Copy'
import {Check} from '@/lib/icons/Check'
import {Button} from '@/src/components/ui/button'
import {shareImage} from '@/src/lib/share-utils'
import {useCreateShareLink} from '@/src/lib/share-api'
import {useDecryptedUrl} from '@/src/hooks/use-decrypted-url'
import {showPhotoActionNotification} from '@/src/lib/notification-utils'
import * as Clipboard from 'expo-clipboard'

interface ShareOptionsSheetProps {
	isOpen: boolean
	onClose: () => void
	photo: Photo | null
}

interface FormData {
	expiryOption: ExpiryOption
	isPinProtected: boolean
	pin: string
}

const EXPIRY_OPTIONS: { value: ExpiryOption; label: string }[] = [
	{value: '5min', label: '5 minutes'},
	{value: '15min', label: '15 minutes'},
	{value: '30min', label: '30 minutes'},
	{value: '1h', label: '1 hour'},
	{value: '8h', label: '8 hours'},
	{value: '24h', label: '24 hours'},
	{value: '3d', label: '3 days'},
	{value: '7d', label: '7 days'},
	{value: '30d', label: '30 days'}
]

// PhotoPreview component
const PhotoPreview = React.memo(({photo}: { photo: Photo }) => {
	const {decryptedUrl, isLoading, error} = useDecryptedUrl(photo)

	const containerStyle = {
		overflow: 'hidden' as const,
		backgroundColor: '#171717',
		alignItems: 'center' as const,
		padding: 4,
		borderColor: darkTheme.primary,
		borderWidth: 1
	}

	const imageContainerStyle = {
		width: '100%' as const,
		height: 200,
		borderRadius: 8,
		backgroundColor: '#333',
		justifyContent: 'center' as const,
		alignItems: 'center' as const
	}

	if (error) {
		return (
			<View style={containerStyle}>
				<View style={imageContainerStyle}>
					<Text style={{
						color: '#dc2626',
						fontSize: 14,
						textAlign: 'center'
					}}>
						Failed to load photo
					</Text>
				</View>
			</View>
		)
	}

	if (isLoading || !decryptedUrl) {
		return (
			<View style={containerStyle}>
				<View style={imageContainerStyle}>
					<ActivityIndicator size="large" color={darkTheme.primary}/>
					<Text style={{
						color: darkTheme.mutedForeground,
						fontSize: 14,
						marginTop: 8
					}}>
						Decrypting photo...
					</Text>
				</View>
			</View>
		)
	}

	return (
		<View style={containerStyle}>
			<Image
				source={{uri: decryptedUrl}}
				style={{
					width: '100%',
					height: 200
				}}
				contentFit="cover"
				transition={200}
				cachePolicy="disk"
				recyclingKey={`share_preview_${photo.id}`}
			/>
		</View>
	)
})

const ShareOptionsSheet: React.FC<ShareOptionsSheetProps> = ({
	isOpen,
	onClose,
	photo
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const pinInputRef = useRef<TextInput>(null)
	const [step, setStep] = useState<'form' | 'link'>('form')
	const [shareUrl, setShareUrl] = useState<string | null>(null)
	const [copied, setCopied] = useState<boolean>(false)
	const [showExpiryPicker, setShowExpiryPicker] = useState<boolean>(false)

	// Form data
	const [formData, setFormData] = useState<FormData>({
		expiryOption: '24h',
		isPinProtected: false,
		pin: ''
	})

	const createShareLinkMutation = useCreateShareLink()

	// Calculate snap points - larger for form, smaller for link
	const snapPoints = useMemo(() => step === 'form' ? ['85%'] : ['50%']
		, [step])

	// Auto-focus PIN input when PIN protection is enabled
	React.useEffect(() => {
		if (formData.isPinProtected && pinInputRef.current) {
			// Small delay to ensure the UI has rendered
			setTimeout(() => {
				pinInputRef.current?.focus()
			}, 100)
		}
	}, [formData.isPinProtected])

	// Handle sheet close
	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close()
		setStep('form')
		setShareUrl(null)
		setCopied(false)
		setFormData({
			expiryOption: '24h',
			isPinProtected: false,
			pin: ''
		})
		onClose()
	}, [onClose])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			handleClose()
		}
	}, [handleClose])

	// Handle native share
	const handleNativeShare = useCallback(async () => {
		if (!photo) return

		handleClose()

		try {
			const result = await shareImage(photo)
			if (!result.success) {
				await showPhotoActionNotification('share', false, result.message)
			}
		} catch (error) {
			await showPhotoActionNotification(
				'share',
				false,
				'An unexpected error occurred while sharing the image.'
			)
		}
	}, [photo, handleClose])

	// Validate form
	const validateForm = (): string | null => {
		if (formData.isPinProtected) {
			if (!formData.pin) {
				return 'Please enter a 4-digit PIN'
			}
			if (formData.pin.length !== 4) {
				return 'PIN must be exactly 4 digits'
			}
			if (!/^\d+$/.test(formData.pin)) {
				return 'PIN must contain only numbers'
			}
		}
		return null
	}

	// Handle create share link
	const handleCreateShareLink = useCallback(async () => {
		if (!photo) return

		const error = validateForm()
		if (error) {
			Alert.alert('Validation Error', error)
			return
		}

		const shareData: CreateShareLinkRequest = {
			photoIds: [photo.id],
			expiryOption: formData.expiryOption,
			...(formData.isPinProtected && formData.pin && {pin: formData.pin})
		}

		createShareLinkMutation.mutate(shareData, {
			onSuccess: async (response) => {
				setShareUrl(response.shareUrl)
				setStep('link')

				// Automatically copy to clipboard
				try {
					await Clipboard.setStringAsync(response.shareUrl)
					setCopied(true)
					setTimeout(() => setCopied(false), 2000)
				} catch (clipboardError) {
					// Silently handle clipboard error - the user can still manually copy
				}
			},
			onError: async (error) => {
				const errorMessage = error instanceof Error ? error.message : 'Failed to create share link'
				await showPhotoActionNotification('share', false, `Failed to create share link: ${errorMessage}`)
			}
		})
	}, [photo, formData, createShareLinkMutation])

	// Handle copy link
	const handleCopyLink = useCallback(async () => {
		if (!shareUrl) return

		try {
			await Clipboard.setStringAsync(shareUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			Alert.alert('Error', 'Failed to copy link to clipboard')
		}
	}, [shareUrl])

	// Update form data
	const updateFormData = (updates: Partial<FormData>) => {
		setFormData(prev => ({...prev, ...updates}))
	}

	// Handle PIN input
	const handlePinChange = (text: string) => {
		// Only allow digits and max 4 characters
		const cleaned = text.replace(/\D/g, '').slice(0, 4)
		updateFormData({pin: cleaned})
	}

	// Focus PIN input
	const focusPinInput = useCallback(() => {
		pinInputRef.current?.focus()
	}, [])

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

	// Render expiry picker modal
	const renderExpiryPicker = () => {
		if (!showExpiryPicker) return null

		return (
			<View style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0,0,0,0.5)',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 1000
			}}>
				<View style={{
					backgroundColor: darkTheme.dark,
					borderRadius: 12,
					padding: 20,
					margin: 20,
					maxHeight: '80%'
				}}>
					<Text style={{
						color: darkTheme.foreground,
						fontSize: 18,
						fontWeight: 'bold',
						marginBottom: 16,
						textAlign: 'center'
					}}>
						Select Expiry Time
					</Text>

					<ScrollView style={{maxHeight: 300}}>
						{EXPIRY_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option.value}
								onPress={() => {
									updateFormData({expiryOption: option.value})
									setShowExpiryPicker(false)
								}}
								style={{
									padding: 16,
									borderRadius: 8,
									marginBottom: 8,
									backgroundColor: formData.expiryOption === option.value ? darkTheme.accent : 'transparent'
								}}
							>
								<Text style={{
									color: darkTheme.foreground,
									fontSize: 16,
									textAlign: 'center'
								}}>
									{option.label}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>

					<TouchableOpacity
						onPress={() => setShowExpiryPicker(false)}
						style={{
							marginTop: 16,
							padding: 12,
							backgroundColor: darkTheme.accent,
							borderRadius: 8
						}}
					>
						<Text style={{
							color: darkTheme.foreground,
							fontSize: 16,
							fontWeight: '600',
							textAlign: 'center'
						}}>
							Done
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		)
	}

	// Don't render if not open
	if (!isOpen) {
		return null
	}

	return (
		<>
			<BottomSheet
				ref={bottomSheetRef}
				index={0}
				snapPoints={snapPoints}
				onChange={handleSheetChanges}
				enablePanDownToClose={true}
				backgroundStyle={{backgroundColor: darkTheme.dark}}
				handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
				backdropComponent={renderBackdrop}
			>
				<BottomSheetScrollView style={{flex: 1}}>
					<SafeAreaView style={{flex: 1, paddingHorizontal: 20, paddingBottom: 48}}>
						{step === 'form' ? (
							<View style={{gap: 24}}>
								{/* Header */}
								<View style={{alignItems: 'center', gap: 16}}>
									<View style={{
										backgroundColor: '#171717',
										borderRadius: 50,
										padding: 16
									}}>
										<Share size={32} color="white"/>
									</View>

									<Text style={{
										color: darkTheme.foreground,
										fontSize: 24,
										fontWeight: 'bold',
										textAlign: 'center'
									}}>
										Share Photo
									</Text>

									<Text style={{
										color: darkTheme.mutedForeground,
										fontSize: 14,
										textAlign: 'center',
										lineHeight: 20
									}}>
										Create a secure link to share your photo while keeping it protected
									</Text>
								</View>

								{/* Photo Preview */}
								{photo && (
									<PhotoPreview photo={photo}/>
								)}

								{/* Expiry Selection */}
								<View style={{gap: 8}}>
									<Text style={{
										color: darkTheme.foreground,
										fontSize: 16,
										fontWeight: '600'
									}}>
										Link Expiration
									</Text>

									<TouchableOpacity
										onPress={() => setShowExpiryPicker(true)}
										style={{
											backgroundColor: '#171717',
											borderRadius: 12,
											padding: 16,
											flexDirection: 'row',
											justifyContent: 'space-between',
											alignItems: 'center'
										}}
									>
										<Text style={{
											color: darkTheme.foreground,
											fontSize: 16
										}}>
											{EXPIRY_OPTIONS.find(opt => opt.value === formData.expiryOption)?.label}
										</Text>
										<Text style={{
											color: darkTheme.mutedForeground,
											fontSize: 14
										}}>
											▼
										</Text>
									</TouchableOpacity>
								</View>

								{/* PIN Protection */}
								<View style={{
									gap: 12,
									backgroundColor: '#171717',
									borderRadius: 12,
									padding: 16
								}}>
									<View style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										alignItems: 'center'
									}}>
										<View style={{flex: 1}}>
											<Text style={{
												color: darkTheme.foreground,
												fontSize: 16,
												fontWeight: '600'
											}}>
												Protect with PIN
											</Text>
											<Text style={{
												color: darkTheme.mutedForeground,
												fontSize: 12,
												marginTop: 4
											}}>
												Add PIN protection to this share link
											</Text>
										</View>

										<TouchableOpacity
											onPress={() => updateFormData({
												isPinProtected: !formData.isPinProtected,
												pin: ''
											})}
											style={{
												width: 50,
												height: 30,
												borderRadius: 15,
												backgroundColor: formData.isPinProtected ? darkTheme.accent : '#333',
												justifyContent: 'center',
												alignItems: formData.isPinProtected ? 'flex-end' : 'flex-start',
												paddingHorizontal: 3
											}}
										>
											<View style={{
												width: 24,
												height: 24,
												borderRadius: 12,
												backgroundColor: 'white'
											}}/>
										</TouchableOpacity>
									</View>

									{/* PIN Input */}
									{formData.isPinProtected && (
										<View style={{marginTop: 16}}>
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
															borderColor: formData.pin.length > index ? darkTheme.accent : '#333'
														}}
													>
														<Text style={{
															color: darkTheme.foreground,
															fontSize: 24,
															fontWeight: 'bold'
														}}>
															{formData.pin[index] ? '●' : ''}
														</Text>
													</TouchableOpacity>
												))}
											</View>

											{/* Hidden input for PIN */}
											<BottomSheetTextInput
												ref={pinInputRef}
												value={formData.pin}
												onChangeText={handlePinChange}
												keyboardType="numeric"
												maxLength={4}
												style={{
													position: 'absolute',
													opacity: 0,
													height: 1,
													width: 1,
													top: -1000 // Move completely off-screen
												}}
												autoComplete="off"
												textContentType="none"
											/>
										</View>
									)}
								</View>

								{/* Action Buttons */}
								<View style={{gap: 12, marginTop: 8}}>
									<Button
										onPress={handleCreateShareLink}
										disabled={createShareLinkMutation.isPending || (formData.isPinProtected && formData.pin.length !== 4)}
										variant="ghost"
										className="h-16 flex-row justify-center items-center"
									>
										<Link size={20} color="white" style={{marginRight: 8}}/>
										<Text style={{
											color: 'white',
											fontSize: 16,
											fontWeight: '600'
										}}>
											{createShareLinkMutation.isPending ? 'Creating Link...' : 'Create Share Link'}
										</Text>
									</Button>

									<Button
										onPress={handleNativeShare}
										variant="ghost"
										className="h-16 flex-row justify-center items-center"
									>
										<ExternalLink size={20} color="white" style={{marginRight: 8}}/>
										<Text style={{
											color: 'white',
											fontSize: 16,
											fontWeight: '600'
										}}>
											Share with Apps
										</Text>
									</Button>
								</View>
							</View>
						) : (
							/* Link Created Step */
							<View style={{gap: 24}}>
								{/* Header */}
								<View style={{alignItems: 'center', gap: 16}}>
									<View style={{
										backgroundColor: '#171717',
										borderRadius: 50,
										padding: 16
									}}>
										<Check size={32} color={darkTheme.primary}/>
									</View>

									<Text style={{
										color: darkTheme.foreground,
										fontSize: 24,
										fontWeight: 'bold',
										textAlign: 'center'
									}}>
										Share Link Created!
									</Text>

									<Text style={{
										color: darkTheme.mutedForeground,
										fontSize: 14,
										textAlign: 'center',
										lineHeight: 20
									}}>
										Your sharing link is ready! Copy it to share with friends and family.
									</Text>
								</View>

								{/* Link Display */}
								<View style={{
									backgroundColor: '#171717',
									borderRadius: 12,
									padding: 16,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 12
								}}>
									<View style={{flex: 1}}>
										<Text style={{
											color: darkTheme.foreground,
											fontSize: 14
										}} numberOfLines={2}>
											{shareUrl}
										</Text>
									</View>

									<TouchableOpacity
										onPress={handleCopyLink}
										style={{
											backgroundColor: darkTheme.accent,
											borderRadius: 8,
											padding: 12
										}}
									>
										{copied ? (
											<Check size={20} color="white"/>
										) : (
											<Copy size={20} color="white"/>
										)}
									</TouchableOpacity>
								</View>

								{/* Security Notice */}
								<Text style={{
									color: darkTheme.mutedForeground,
									fontSize: 12,
									textAlign: 'center',
									lineHeight: 16
								}}>
									For security reasons, we won't be able to show this link again, make sure to copy it
									safely
								</Text>
							</View>
						)}
					</SafeAreaView>
				</BottomSheetScrollView>
			</BottomSheet>

			{/* Expiry Picker Modal */}
			{renderExpiryPicker()}
		</>
	)
}

export default ShareOptionsSheet
