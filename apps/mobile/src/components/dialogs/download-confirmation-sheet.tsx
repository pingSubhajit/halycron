import React, {useCallback, useMemo, useRef} from 'react'
import {Text, View} from 'react-native'
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet'
import {Photo} from '@/src/lib/types'
import {darkTheme} from '@/src/theme/theme'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Download} from '@/lib/icons/Download'
import {Button} from '@/src/components/ui/button'
import {downloadImageToGallery} from '@/src/lib/download-utils'
import {showDownloadNotification} from '@/src/lib/notification-utils'

interface DownloadConfirmationSheetProps {
	isOpen: boolean
	onClose: () => void
	photo: Photo | null
}

const DownloadConfirmationSheet: React.FC<DownloadConfirmationSheetProps> = ({
	isOpen,
	onClose,
	photo
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)

	// Calculate snap points
	const snapPoints = useMemo(() => ['50%'], [])

	// Handle sheet close
	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close()
		onClose()
	}, [onClose])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			onClose()
		}
	}, [onClose])

	// Handle download confirmation
	const handleConfirm = useCallback(async () => {
		if (!photo) return

		// Close the sheet immediately
		handleClose()

		// Process download in background and show notification when complete
		try {
			const result = await downloadImageToGallery(photo)
			await showDownloadNotification(result.success, result.message)
		} catch (error) {
			// Fallback error handling
			await showDownloadNotification(
				false,
				'An unexpected error occurred while downloading the image.'
			)
		}
	}, [photo, handleClose])

	// Backdrop component that handles backdrop touches
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
			snapPoints={snapPoints}
			onChange={handleSheetChanges}
			enablePanDownToClose={true}
			backgroundStyle={{backgroundColor: darkTheme.dark}}
			handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
			backdropComponent={renderBackdrop}
		>
			<BottomSheetView style={{flex: 1}}>
				<SafeAreaView style={{flex: 1, paddingHorizontal: 20, paddingBottom: 48}}>
					<View style={{flex: 1, justifyContent: 'flex-end', gap: 32}}>
						{/* Header */}
						<View style={{alignItems: 'center', gap: 16}}>
							<View style={{
								backgroundColor: '#450a0a',
								borderRadius: 50,
								padding: 16
							}}>
								<Download size={32} color="white"/>
							</View>

							<Text style={{
								color: darkTheme.foreground,
								fontSize: 24,
								fontWeight: 'bold',
								textAlign: 'center'
							}}>
								Download Image?
							</Text>

							<Text style={{
								color: darkTheme.mutedForeground,
								fontSize: 16,
								textAlign: 'center',
								lineHeight: 24
							}}>
								Downloading images may pose security risks. The image will be saved to your device's
								gallery where other apps may access it.
							</Text>
						</View>

						{/* Action Buttons */}
						<View style={{marginBottom: 64, gap: 24}}>
							<Button
								onPress={handleConfirm}
								className="h-16 flex-row justify-center items-center"
							>
								<Download size={20} color="white" style={{marginRight: 8}}/>
								<Text style={{
									color: 'white',
									fontSize: 16,
									fontWeight: '600'
								}}>
									Download Anyway
								</Text>
							</Button>

							<Button
								variant="outline"
								onPress={handleClose}
								className="h-16 flex-row justify-center items-center"
							>
								<Text style={{
									color: darkTheme.mutedForeground,
									fontSize: 16,
									fontWeight: '500'
								}}>
									Cancel
								</Text>
							</Button>
						</View>
					</View>
				</SafeAreaView>
			</BottomSheetView>
		</BottomSheet>
	)
}

export default DownloadConfirmationSheet
