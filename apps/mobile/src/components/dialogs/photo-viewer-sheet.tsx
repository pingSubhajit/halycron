import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {BackHandler, Dimensions, Text, View} from 'react-native'
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet'
import {Image} from 'expo-image'
import {Photo} from '@/src/lib/types'
import {darkTheme} from '@/src/theme/theme'
import {SafeAreaView} from 'react-native-safe-area-context'

const {width: screenWidth, height: screenHeight} = Dimensions.get('window')

interface PhotoViewerSheetProps {
	isOpen: boolean
	onClose: () => void
	photo: Photo | null
	decryptedUrl: string | null
}

const PhotoViewerSheet: React.FC<PhotoViewerSheetProps> = ({
	isOpen,
	onClose,
	photo,
	decryptedUrl
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)

	// Calculate snap points - we want it to be full screen
	const snapPoints = useMemo(() => ['100%'], [])

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

	// Handle Android back button
	useEffect(() => {
		if (!isOpen) return

		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			handleClose()
			return true // Prevent default back button behavior
		})

		return () => backHandler.remove()
	}, [isOpen, handleClose])

	// Calculate image dimensions to fit screen while maintaining aspect ratio
	const getImageDimensions = () => {
		if (!photo?.imageWidth || !photo?.imageHeight) {
			return {
				width: screenWidth,
				height: screenWidth * 0.75 // 4:3 aspect ratio fallback
			}
		}

		const aspectRatio = photo.imageWidth / photo.imageHeight
		const maxWidth = screenWidth
		const maxHeight = screenHeight * 0.8 // Leave some space for UI

		let width = maxWidth
		let height = width / aspectRatio

		if (height > maxHeight) {
			height = maxHeight
			width = height * aspectRatio
		}

		return {width, height}
	}

	const imageDimensions = getImageDimensions()

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
			backgroundStyle={{
				backgroundColor: darkTheme.dark
			}}
			handleIndicatorStyle={{
				backgroundColor: darkTheme.accent
			}}
		>
			<BottomSheetView style={{flex: 1}}>
				<SafeAreaView className="flex-1">
					{/* Image Container */}
					<View
						style={{
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
							padding: 20
						}}
					>
						{decryptedUrl ? (
							<Image
								source={{uri: decryptedUrl}}
								style={imageDimensions}
								contentFit="contain"
								transition={200}
							/>
						) : (
							<View
								style={{
									...imageDimensions,
									backgroundColor: darkTheme.muted,
									justifyContent: 'center',
									alignItems: 'center',
									borderRadius: 8
								}}
							>
								<Text
									style={{
										color: darkTheme.mutedForeground,
										fontSize: 16
									}}
								>
									Loading image...
								</Text>
							</View>
						)}
					</View>

					{/* Footer with image info */}
					{photo && (
						<View
							style={{
								paddingHorizontal: 20,
								paddingVertical: 16,
								borderTopWidth: 1,
								borderTopColor: darkTheme.border
							}}
						>
							<View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 16}}>
								{photo.imageWidth && photo.imageHeight && (
									<Text
										style={{
											color: darkTheme.mutedForeground,
											fontSize: 12
										}}
									>
										{photo.imageWidth} × {photo.imageHeight}
									</Text>
								)}
								{photo.mimeType && (
									<Text
										style={{
											color: darkTheme.mutedForeground,
											fontSize: 12
										}}
									>
										{photo.mimeType.split('/')[1]?.toUpperCase() || 'IMAGE'}
									</Text>
								)}
							</View>
						</View>
					)}
				</SafeAreaView>
			</BottomSheetView>
		</BottomSheet>
	)
}

export default PhotoViewerSheet
