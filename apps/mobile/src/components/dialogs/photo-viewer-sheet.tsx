import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useSharedValue} from 'react-native-reanimated'
import {ActivityIndicator, BackHandler, Dimensions, Text, TouchableWithoutFeedback, View} from 'react-native'
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet'
import {Photo} from '@/src/lib/types'
import {darkTheme} from '@/src/theme/theme'
import {SafeAreaView} from 'react-native-safe-area-context'
import Carousel from 'react-native-reanimated-carousel'
import {useAllPhotos} from '@/src/hooks/use-photos'
import {useDecryptedUrl} from '@/src/hooks/use-decrypted-url'
import {ImageZoom} from '@likashefqet/react-native-image-zoom'
import {SystemBars} from 'react-native-edge-to-edge'
import PhotoActionsBar from '@/src/components/photo-actions-bar'
import {useDeleteConfirmation, useDownloadConfirmation} from '@/src/components/dialog-provider'


const {width: screenWidth, height: screenHeight} = Dimensions.get('window')

interface PhotoViewerSheetProps {
	isOpen: boolean
	onClose: () => void
	initialPhoto: Photo | null
}


// Virtualized photo item component with optimized memoization
const PhotoItem = React.memo(({photo, isActive, onZoomStateChange, onImagePress}: {
	photo: Photo
	isActive: boolean
	onZoomStateChange?: (isZoomed: boolean) => void
	onImagePress?: () => void
}) => {
	const scaleValue = useSharedValue(1)
	const hookResult = useDecryptedUrl(isActive ? photo : null)
	const {decryptedUrl, isLoading, error} = hookResult

	// Reset scale when photo changes
	useEffect(() => {
		scaleValue.value = 1
		onZoomStateChange?.(false)
	}, [photo.id, scaleValue, onZoomStateChange])

	const containerStyle = useMemo(() => ({
		width: screenWidth,
		height: screenHeight * 0.85, // Use fixed height instead of flex
		justifyContent: 'center' as const,
		alignItems: 'center' as const
	}), [])

	const placeholderStyle = useMemo(() => {
		const fallbackWidth = screenWidth
		const fallbackHeight = screenWidth * 0.75 // 4:3 aspect ratio fallback

		return {
			width: fallbackWidth,
			height: fallbackHeight,
			backgroundColor: darkTheme.muted,
			justifyContent: 'center' as const,
			alignItems: 'center' as const,
			borderRadius: 8
		}
	}, [])

	if (error) {
		return (
			<View style={containerStyle}>
				<View style={placeholderStyle}>
					<Text
						style={{
							color: '#dc2626',
							fontSize: 16,
							textAlign: 'center'
						}}
					>
						Failed to load image
					</Text>
					<Text style={{color: '#dc2626', fontSize: 12, marginTop: 4}}>
						Error: {error}
					</Text>
				</View>
			</View>
		)
	}

	if (isLoading || !decryptedUrl) {
		return (
			<View style={containerStyle}>
				<View style={placeholderStyle}>
					<ActivityIndicator size="large" color={darkTheme.primary}/>
					<Text
						style={{
							color: darkTheme.mutedForeground,
							fontSize: 16,
							marginTop: 12
						}}
					>
						Decrypting photo...
					</Text>
					<Text style={{color: darkTheme.mutedForeground, fontSize: 12, marginTop: 4}}>
						ID: {photo.id.slice(-8)}
					</Text>
				</View>
			</View>
		)
	}

	return (
		<TouchableWithoutFeedback onPress={onImagePress}>
			<View style={containerStyle}>
				<ImageZoom
					uri={decryptedUrl}
					minScale={1}
					maxScale={5}
					doubleTapScale={2}
					maxPanPointers={2}
					isPanEnabled={true}
					isPinchEnabled={true}
					isDoubleTapEnabled={true}
					scale={scaleValue}
					onPinchStart={() => {
						// User started pinching
						onZoomStateChange?.(true)
					}}
					onPinchEnd={() => {
						// Check final scale after pinch ends
						setTimeout(() => {
							if (scaleValue.value > 1) {
								onZoomStateChange?.(true)
							} else {
								onZoomStateChange?.(false)
							}
						}, 50)
					}}
					onDoubleTap={(zoomType) => {
						// Double tap will change zoom state
						setTimeout(() => {
							// Check scale after animation
							if (scaleValue.value > 1) {
								onZoomStateChange?.(true)
							} else {
								onZoomStateChange?.(false)
							}
						}, 100)
					}}
					style={{
						width: screenWidth,
						height: screenHeight * 0.85
					}}
					resizeMode="contain"
				/>
			</View>
		</TouchableWithoutFeedback>
	)
}, (prevProps, nextProps) => {
	// Custom comparison for better performance - ensure we're comparing the right photo
	const isSamePhoto = prevProps.photo.id === nextProps.photo.id
	const isSameActiveState = prevProps.isActive === nextProps.isActive
	const isSameImagePress = prevProps.onImagePress === nextProps.onImagePress

	return isSamePhoto && isSameActiveState && isSameImagePress
})


const PhotoViewerSheet: React.FC<PhotoViewerSheetProps> = ({
	isOpen,
	onClose,
	initialPhoto
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const carouselRef = useRef<any>(null)
	const [hasInitialized, setHasInitialized] = useState(false)
	const [isImageZoomed, setIsImageZoomed] = useState(false)
	const [isActionBarVisible, setIsActionBarVisible] = useState(true)

	// Check if download confirmation is open
	const {isDownloadConfirmationSheetOpen} = useDownloadConfirmation()

	// Check if delete confirmation is open
	const {isDeleteConfirmationSheetOpen} = useDeleteConfirmation()

	// Fetch all photos
	const {data: allPhotos = [], isLoading: isLoadingPhotos, refetch: refetchPhotos} = useAllPhotos()

	// Use allPhotos directly instead of local state to avoid useEffect
	const localPhotos = allPhotos


	// Calculate the initial index for the carousel
	const getInitialIndex = useCallback(() => {
		if (!initialPhoto || !localPhotos.length) return 0
		const foundIndex = localPhotos.findIndex(photo => photo.id === initialPhoto.id)
		return foundIndex !== -1 ? foundIndex : 0
	}, [initialPhoto?.id, localPhotos])

	// Initialize currentIndex with the correct initial index
	const [currentIndex, setCurrentIndex] = useState(() => getInitialIndex())

	// Calculate snap points - we want it to be full screen
	const snapPoints = useMemo(() => ['100%'], [])

	// Calculate reliable carousel dimensions
	const carouselDimensions = useMemo(() => {
		// Header takes approximately 100px, leave some margin
		const headerHeight = 0
		const availableHeight = screenHeight - headerHeight

		return {
			width: screenWidth,
			height: Math.max(availableHeight * 0.85, 400) // Ensure minimum height
		}
	}, [])

	// Handle sheet close
	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close()
		onClose()
		setHasInitialized(false)
		setIsImageZoomed(false)
		setIsActionBarVisible(true)
	}, [onClose])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			onClose()
			setHasInitialized(false)
			setIsImageZoomed(false)
			setIsActionBarVisible(true)
		}
	}, [onClose])

	// Handle Android back button
	useEffect(() => {
		if (!isOpen) return

		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			handleClose()
			return true
		})

		return () => backHandler.remove()
	}, [isOpen, handleClose])

	// Optimized carousel index change handler
	const handleIndexChange = useCallback((index: number) => {
		setCurrentIndex(index)
		// Reset zoom state when navigating to a different photo
		setIsImageZoomed(false)
	}, [])

	// Handle zoom state changes
	const handleZoomStateChange = useCallback((isZoomed: boolean) => {
		setIsImageZoomed(isZoomed)
	}, [])

	// Handle photo deletion
	const handlePhotoDeleted = useCallback((deletedPhoto: Photo) => {
		// Check if this was the last photo
		if (localPhotos.length <= 1) {
			handleClose()
			return
		}

		// Adjust current index if needed
		setCurrentIndex(prevIndex => {
			const newLength = localPhotos.length - 1
			// If we deleted a photo before the current one, shift index back
			if (prevIndex > 0 && prevIndex >= newLength) {
				return newLength - 1
			}
			/*
			 * If we deleted the current photo, stay at same index (showing next photo)
			 * Unless we're at the end, then go to previous
			 */
			if (prevIndex >= newLength) {
				return Math.max(0, newLength - 1)
			}
			return prevIndex
		})

		// Refetch photos to update the gallery
		refetchPhotos()
	}, [handleClose, refetchPhotos, localPhotos.length])

	// Handle action bar visibility
	const handleImagePress = useCallback(() => {
		// Don't toggle action bar if any confirmation dialog is open
		if (isDownloadConfirmationSheetOpen || isDeleteConfirmationSheetOpen) return
		setIsActionBarVisible(prev => !prev)
	}, [isDownloadConfirmationSheetOpen, isDeleteConfirmationSheetOpen])

	// Update currentIndex when the sheet opens and we have photos
	useEffect(() => {
		if (isOpen && localPhotos.length > 0 && !hasInitialized) {
			const newIndex = getInitialIndex()
			setCurrentIndex(newIndex)
		}
	}, [isOpen, localPhotos.length, hasInitialized, getInitialIndex])

	// Mark as initialized when opening
	useEffect(() => {
		if (isOpen) {
			setHasInitialized(true)
		}
	}, [isOpen])

	// Reset when sheet closes
	useEffect(() => {
		if (!isOpen) {
			setHasInitialized(false)
			setIsImageZoomed(false)
			setIsActionBarVisible(true)
		}
	}, [isOpen])

	// Optimized render item with stable reference
	const renderItem = useCallback(({item, index}: { item: Photo; index: number }) => {
		// Calculate isActive inline to avoid depending on activeIndices memo
		const isActive = index === currentIndex ||
			index === currentIndex - 1 ||
			index === currentIndex + 1

		// Safety check for invalid item
		if (!item || !item.id) {
			return (
				<View style={{
					width: screenWidth,
					height: screenHeight * 0.85,
					justifyContent: 'center',
					alignItems: 'center',
					borderColor: 'red',
					borderWidth: 2
				}}>
					<Text style={{color: darkTheme.mutedForeground}}>Invalid photo</Text>
				</View>
			)
		}

		return (
			<PhotoItem
				key={item.id}
				photo={item}
				isActive={isActive}
				onZoomStateChange={index === currentIndex ? handleZoomStateChange : undefined}
				onImagePress={index === currentIndex && !isDownloadConfirmationSheetOpen && !isDeleteConfirmationSheetOpen ? handleImagePress : undefined}
			/>
		)
	}, [currentIndex, handleZoomStateChange, handleImagePress, isDownloadConfirmationSheetOpen, isDeleteConfirmationSheetOpen])

	// Don't render if not open
	if (!isOpen) {
		return null
	}

	// Show loading if photos are still loading
	if (isLoadingPhotos) {
		return (
			<BottomSheet
				ref={bottomSheetRef}
				index={0}
				snapPoints={snapPoints}
				onChange={handleSheetChanges}
				enablePanDownToClose={true}
				backgroundStyle={{backgroundColor: darkTheme.dark}}
				handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
			>
				<BottomSheetView style={{flex: 1}}>
					<SafeAreaView style={{flex: 1}}>
						<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
							<ActivityIndicator size="large" color={darkTheme.primary}/>
							<Text style={{color: darkTheme.mutedForeground, fontSize: 16, marginTop: 12}}>
								Loading photos...
							</Text>
						</View>
					</SafeAreaView>
				</BottomSheetView>
			</BottomSheet>
		)
	}

	// Show error if no photos
	if (!localPhotos.length) {
		return (
			<BottomSheet
				ref={bottomSheetRef}
				index={0}
				snapPoints={snapPoints}
				onChange={handleSheetChanges}
				enablePanDownToClose={true}
				backgroundStyle={{backgroundColor: darkTheme.dark}}
				handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
			>
				<BottomSheetView style={{flex: 1}}>
					<SafeAreaView style={{flex: 1}}>
						<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
							<Text style={{color: darkTheme.mutedForeground, fontSize: 16}}>
								No photos available
							</Text>
						</View>
					</SafeAreaView>
				</BottomSheetView>
			</BottomSheet>
		)
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
		>
			<BottomSheetView className="flex-1">
				<SystemBars
					hidden={{
						statusBar: !isActionBarVisible,
						navigationBar: !isActionBarVisible
					}}
				/>
				<SafeAreaView className="flex-1">
					<View className="justify-center">
						<Carousel
							key={`${carouselDimensions.width}-${carouselDimensions.height}`}
							ref={carouselRef}
							loop={false}
							width={carouselDimensions.width}
							height={carouselDimensions.height}
							data={localPhotos}
							scrollAnimationDuration={200}
							onSnapToItem={handleIndexChange}
							defaultIndex={getInitialIndex()}
							renderItem={renderItem}
							windowSize={3}
							pagingEnabled={true}
							enabled={!isImageZoomed}
						/>
						<PhotoActionsBar
							isVisible={isActionBarVisible}
							currentPhoto={localPhotos[currentIndex] || null}
							onPhotoDeleted={handlePhotoDeleted}
						/>
					</View>
				</SafeAreaView>
			</BottomSheetView>
		</BottomSheet>
	)
}

export default PhotoViewerSheet
