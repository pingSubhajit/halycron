import React, {useCallback, useMemo, useRef} from 'react'
import {Text, View} from 'react-native'
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet'
import {Photo} from '@/src/lib/types'
import {darkTheme} from '@/src/theme/theme'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Trash2} from '@/lib/icons/Trash2'
import {Button} from '@/src/components/ui/button'
import {deletePhoto} from '@/src/lib/delete-utils'

interface DeleteConfirmationSheetProps {
	isOpen: boolean
	onClose: () => void
	photo: Photo | null
	onPhotoDeleted?: (photo: Photo) => void
}

const DeleteConfirmationSheet: React.FC<DeleteConfirmationSheetProps> = ({
	isOpen,
	onClose,
	photo,
	onPhotoDeleted
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)

	// Calculate snap points
	const snapPoints = useMemo(() => ['40%'], [])

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

	// Handle delete confirmation
	const handleConfirm = useCallback(async () => {
		if (!photo) return

		// Close the sheet immediately
		handleClose()

		// Process deletion in background
		try {
			const result = await deletePhoto(photo)

			// If deletion was successful and callback is provided, call it
			if (result.success && onPhotoDeleted) {
				onPhotoDeleted(photo)
			}
		} catch (error) {
			// Fallback error handling - could log error but no notification
			console.error('Failed to delete photo:', error)
		}
	}, [photo, handleClose, onPhotoDeleted])

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
								backgroundColor: '#171717',
								borderRadius: 50,
								padding: 16
							}}>
								<Trash2 size={32} color="white"/>
							</View>

							<Text style={{
								color: darkTheme.foreground,
								fontSize: 24,
								fontWeight: 'bold',
								textAlign: 'center'
							}}>
								Delete Photo?
							</Text>

							<Text style={{
								color: darkTheme.mutedForeground,
								fontSize: 16,
								textAlign: 'center',
								lineHeight: 24
							}}>
								This action cannot be undone. The photo will be permanently removed from your account
								and all albums.
							</Text>
						</View>

						{/* Action Buttons */}
						<View style={{marginBottom: 64, gap: 24}}>
							<Button
								onPress={handleConfirm}
								variant="ghost"
								className="h-16 flex-row justify-center items-center"
							>
								<Trash2 size={20} color="white" style={{marginRight: 8}}/>
								<Text style={{
									color: 'white',
									fontSize: 16,
									fontWeight: '600'
								}}>
									Delete Forever
								</Text>
							</Button>
						</View>
					</View>
				</SafeAreaView>
			</BottomSheetView>
		</BottomSheet>
	)
}

export default DeleteConfirmationSheet
