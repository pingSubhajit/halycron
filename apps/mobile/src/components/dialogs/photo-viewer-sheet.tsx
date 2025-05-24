import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ActivityIndicator, BackHandler, Dimensions, Text, View} from 'react-native'
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet'
import {Image} from 'expo-image'
import {Photo} from '@/src/lib/types'
import {darkTheme} from '@/src/theme/theme'
import {SafeAreaView} from 'react-native-safe-area-context'
import Carousel from 'react-native-reanimated-carousel'
import {useAllPhotos} from '@/src/hooks/use-photos'
import {useDecryptedUrl} from '@/src/hooks/use-decrypted-url'

const {width: screenWidth, height: screenHeight} = Dimensions.get('window')

interface PhotoViewerSheetProps {
	isOpen: boolean
	onClose: () => void
	initialPhoto: Photo | null
}


// Virtualized photo item component with optimized memoization
const PhotoItem = React.memo(({photo, isActive}: {
	photo: Photo
	isActive: boolean
}) => {
	const hookResult = useDecryptedUrl(isActive ? photo : null)
	const {decryptedUrl, isLoading, error} = hookResult

	const imageDimensions = useMemo(() => {
		if (!photo?.imageWidth || !photo?.imageHeight || photo.imageWidth <= 0 || photo.imageHeight <= 0) {
			return {
				width: screenWidth,
				height: screenWidth * 0.75 // 4:3 aspect ratio fallback
			}
		}

		const aspectRatio = photo.imageWidth / photo.imageHeight
		const maxWidth = screenWidth
		const maxHeight = screenHeight * 0.85

		let width = maxWidth
		let height = width / aspectRatio

		if (height > maxHeight) {
			height = maxHeight
			width = height * aspectRatio
		}

		// Ensure minimum dimensions
		const finalWidth = Math.max(width, 100)
		const finalHeight = Math.max(height, 100)

		return {width: finalWidth, height: finalHeight}
	}, [photo?.imageWidth, photo?.imageHeight])

	const containerStyle = useMemo(() => ({
		width: screenWidth,
		height: screenHeight * 0.85, // Use fixed height instead of flex
		justifyContent: 'center' as const,
		alignItems: 'center' as const
	}), [])

	const placeholderStyle = useMemo(() => ({
		...imageDimensions,
		backgroundColor: darkTheme.muted,
		justifyContent: 'center' as const,
		alignItems: 'center' as const,
		borderRadius: 8
	}), [imageDimensions])

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
		<View style={containerStyle}>
			<Image
				source={{uri: decryptedUrl}}
				style={imageDimensions}
				// contentFit="contain"
				transition={200}
				cachePolicy="memory-disk"
			/>
		</View>
	)
}, (prevProps, nextProps) => {
	// Custom comparison for better performance - ensure we're comparing the right photo
	const isSamePhoto = prevProps.photo.id === nextProps.photo.id
	const isSameActiveState = prevProps.isActive === nextProps.isActive

	return isSamePhoto && isSameActiveState
})

const PhotoViewerSheet: React.FC<PhotoViewerSheetProps> = ({
	isOpen,
	onClose,
	initialPhoto
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const carouselRef = useRef<any>(null)
	const [hasInitialized, setHasInitialized] = useState(false)

	// Fetch all photos
	const {data: allPhotos = [], isLoading: isLoadingPhotos} = useAllPhotos()

	// Find initial photo index - memoized for performance
	const initialIndex = useMemo(() => {
		if (!initialPhoto || !allPhotos.length) {
			return 0
		}
		const index = allPhotos.findIndex(photo => photo.id === initialPhoto.id)
		return index !== -1 ? index : 0
	}, [initialPhoto?.id, allPhotos.length])

	// Initialize currentIndex with the correct initial index
	const [currentIndex, setCurrentIndex] = useState(0) // Start with 0, update when ready

	// Update currentIndex when initialIndex changes and we have photos
	useEffect(() => {
		if (allPhotos.length > 0 && !hasInitialized) {
			setCurrentIndex(initialIndex)
		}
	}, [initialIndex, hasInitialized, allPhotos.length])

	// Calculate snap points - we want it to be full screen
	const snapPoints = useMemo(() => ['100%'], [])

	// Calculate reliable carousel dimensions
	const carouselDimensions = useMemo(() => {
		// Header takes approximately 100px, leave some margin
		const headerHeight = 120
		const availableHeight = screenHeight - headerHeight

		return {
			width: screenWidth,
			height: Math.max(availableHeight * 0.85, 400) // Ensure minimum height
		}
	}, [])

	// Optimized active indices calculation - only current photo for better performance
	const activeIndices = useMemo(() => {
		const indices = new Set<number>()
		// Only load current and immediate neighbors
		indices.add(currentIndex)
		if (currentIndex > 0) indices.add(currentIndex - 1)
		if (currentIndex < allPhotos.length - 1) indices.add(currentIndex + 1)
		return indices
	}, [currentIndex, allPhotos.length])

	// Handle sheet close
	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close()
		onClose()
		setHasInitialized(false)
	}, [onClose])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			onClose()
			setHasInitialized(false)
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
	}, [])

	// Jump to initial photo ONCE when carousel is ready and sheet opens
	useEffect(() => {
		if (isOpen && !hasInitialized && carouselRef.current && allPhotos.length > 0) {
			setCurrentIndex(initialIndex)

			setTimeout(() => {
				if (carouselRef.current) {
					carouselRef.current.scrollTo({index: initialIndex, animated: false})
					setHasInitialized(true)
				}
			}, 100)
		}
	}, [isOpen, hasInitialized, allPhotos.length, initialIndex])

	// Reset initialization flag when sheet closes
	useEffect(() => {
		if (!isOpen) {
			setHasInitialized(false)
		}
	}, [isOpen])

	// Optimized render item with stable reference
	const renderItem = useCallback(({item, index}: { item: Photo; index: number }) => {
		const isActive = activeIndices.has(index)

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
			/>
		)
	}, [activeIndices, currentIndex])

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
					<SafeAreaView className="flex-1">
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
	if (!allPhotos.length) {
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
					<SafeAreaView className="flex-1">
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
			<BottomSheetView style={{flex: 1}}>
				<SafeAreaView style={{flex: 1}}>
					<View style={{flex: 1, justifyContent: 'center'}}>
						<Carousel
							key={`${carouselDimensions.width}-${carouselDimensions.height}`}
							ref={carouselRef}
							loop={false}
							width={carouselDimensions.width}
							height={carouselDimensions.height}
							data={allPhotos}
							scrollAnimationDuration={200}
							onSnapToItem={handleIndexChange}
							defaultIndex={initialIndex}
							renderItem={renderItem}
							windowSize={3}
							pagingEnabled={true}
						/>
					</View>
				</SafeAreaView>
			</BottomSheetView>
		</BottomSheet>
	)
}

export default PhotoViewerSheet
