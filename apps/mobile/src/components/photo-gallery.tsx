import React, {useCallback, useMemo, useState} from 'react'
import {Dimensions, FlatList, RefreshControl, Text, View} from 'react-native'
import {Photo} from '../lib/types'
import {EncryptedImage} from './encrypted-image'
import {useMemoryLimitedPhotos} from '../hooks/use-memory-limited-photos'

type Props = {
	photos: Photo[]
	isLoading?: boolean
	error?: string | null
	headerComponent?: () => React.ReactElement
	onRefresh?: () => void
	isRefreshing?: boolean
}

const {width: screenWidth} = Dimensions.get('window')
const PHOTO_MARGIN = 6
const COLUMNS = 2
const COLUMN_WIDTH = (screenWidth - (PHOTO_MARGIN * (COLUMNS + 1))) / COLUMNS

const LoadingState = () => (
	<View className="flex-1 justify-center items-center p-6">
		<Text className="text-primary-foreground text-center">
			Unlocking your memories...
		</Text>
	</View>
)

const ErrorState = ({error}: { error: string }) => (
	<View className="flex-1 justify-center items-center p-6">
		<Text className="text-primary-foreground text-center">
			{error || 'Hmm, we ran into a hiccup loading your photos. Mind trying again?'}
		</Text>
	</View>
)

const EmptyState = () => (
	<View className="flex-1 justify-center items-center p-6">
		<Text className="text-primary-foreground text-center text-lg font-medium mb-2">
			No photos yet
		</Text>
		<Text className="text-muted-foreground text-center">
			Upload your first photo to get started
		</Text>
	</View>
)

type PhotoWithLayout = Photo & {
	calculatedHeight: number
	column: number
	yPosition: number
	absolutePosition: { x: number; y: number }
}

const calculateMasonryLayout = (photos: Photo[]): PhotoWithLayout[] => {
	const photosWithLayout: PhotoWithLayout[] = []
	const columnHeights = Array.from({length: COLUMNS}, () => 0)

	photos.forEach((photo, index) => {
		const hasValidDimensions = photo.imageWidth != null && photo.imageHeight != null &&
			photo.imageWidth > 0 && photo.imageHeight > 0

		const aspectRatio = hasValidDimensions
			? (photo.imageWidth as number) / (photo.imageHeight as number)
			: 1
		const calculatedHeight = COLUMN_WIDTH / aspectRatio

		// Find the shortest column
		const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
		const yPosition = columnHeights[shortestColumnIndex]!

		// Calculate absolute position
		const x = PHOTO_MARGIN + (shortestColumnIndex * (COLUMN_WIDTH + PHOTO_MARGIN))
		const y = yPosition + PHOTO_MARGIN

		const photoWithLayout: PhotoWithLayout = {
			...photo,
			calculatedHeight,
			column: shortestColumnIndex,
			yPosition,
			absolutePosition: {x, y}
		}

		photosWithLayout.push(photoWithLayout)
		columnHeights[shortestColumnIndex]! += calculatedHeight + PHOTO_MARGIN
	})

	return photosWithLayout
}

const MasonryPhotoItem = React.memo(({photo, memoryPhotos, photoIndex}: {
	photo: PhotoWithLayout;
	memoryPhotos: any[];
	photoIndex: number
}) => {
	return (
		<View
			style={{
				position: 'absolute',
				left: photo.absolutePosition.x,
				top: photo.absolutePosition.y,
				width: COLUMN_WIDTH,
				height: photo.calculatedHeight
			}}
		>
			<EncryptedImage
				photo={photo}
				style={{
					width: COLUMN_WIDTH,
					height: photo.calculatedHeight
				}}
				shouldUseThumbnail={true}
				loadDelay={photoIndex * 100} // Stagger loading by 100ms per photo
			/>
		</View>
	)
})

MasonryPhotoItem.displayName = 'MasonryPhotoItem'

export const PhotoGallery = ({photos, isLoading, error, headerComponent, onRefresh, isRefreshing}: Props) => {
	const [visibleRangeState, setVisibleRangeState] = useState<{ start: number; end: number }>({start: 0, end: 10})

	// Stabilize the visibleRange object to prevent unnecessary re-renders
	const visibleRange = useMemo(() => ({
		start: visibleRangeState.start,
		end: visibleRangeState.end
	}), [visibleRangeState.start, visibleRangeState.end])

	// Use memory-limited photos hook - always call hooks at top level
	const {memoryPhotos, renderablePhotos, getStats} = useMemoryLimitedPhotos({
		photos: photos || [],
		maxInMemory: 50,
		visibleRange,
		preloadBuffer: 5
	})

	const masonryPhotos = useMemo(() => {
		if (!photos || photos.length === 0) return []
		return calculateMasonryLayout(photos)
	}, [photos])

	// Calculate total height for the container
	const totalHeight = useMemo(() => {
		if (masonryPhotos.length === 0) return 0

		const columnHeights = Array.from({length: COLUMNS}, () => 0)
		masonryPhotos.forEach(photo => {
			const columnHeight = photo.yPosition + photo.calculatedHeight + PHOTO_MARGIN
			columnHeights[photo.column] = Math.max(columnHeights[photo.column]!, columnHeight)
		})

		return Math.max(...columnHeights) + PHOTO_MARGIN
	}, [masonryPhotos])

	// Track visible items based on scroll position
	const onScroll = useCallback((event: any) => {
		const scrollY = event.nativeEvent.contentOffset.y
		const containerHeight = event.nativeEvent.layoutMeasurement.height

		const visibleTop = scrollY - 200 // Buffer
		const visibleBottom = scrollY + containerHeight + 200

		// Find visible photos
		const visiblePhotos = masonryPhotos.filter(photo => {
			const photoTop = photo.absolutePosition.y
			const photoBottom = photoTop + photo.calculatedHeight
			return photoBottom >= visibleTop && photoTop <= visibleBottom
		})

		if (visiblePhotos.length > 0) {
			const firstIndex = masonryPhotos.indexOf(visiblePhotos[0]!)
			const lastIndex = masonryPhotos.indexOf(visiblePhotos[visiblePhotos.length - 1]!)

			const newStart = Math.max(0, firstIndex)
			const newEnd = Math.min(masonryPhotos.length - 1, lastIndex)

			// Only update if the range has actually changed
			setVisibleRangeState(prev => {
				if (prev.start !== newStart || prev.end !== newEnd) {
					return {start: newStart, end: newEnd}
				}
				return prev
			})
		}
	}, [masonryPhotos])

	// Handle loading/error states after hooks
	if (isLoading && (!photos || photos.length === 0)) {
		return (
			<View style={{flex: 1}}>
				<FlatList
					data={[]}
					renderItem={() => null}
					ListHeaderComponent={headerComponent}
					refreshControl={
						onRefresh ? (
							<RefreshControl
								refreshing={isRefreshing || false}
								onRefresh={onRefresh}
							/>
						) : undefined
					}
					contentContainerStyle={{flex: 1}}
				/>
				<View style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					justifyContent: 'center',
					alignItems: 'center',
					padding: 24
				}}>
					<LoadingState/>
				</View>
			</View>
		)
	}

	if (error) {
		return (
			<View style={{flex: 1}}>
				<FlatList
					data={[]}
					renderItem={() => null}
					ListHeaderComponent={headerComponent}
					refreshControl={
						onRefresh ? (
							<RefreshControl
								refreshing={isRefreshing || false}
								onRefresh={onRefresh}
							/>
						) : undefined
					}
					contentContainerStyle={{flex: 1}}
				/>
				<View style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					justifyContent: 'center',
					alignItems: 'center',
					padding: 24
				}}>
					<ErrorState error={error}/>
				</View>
			</View>
		)
	}

	if (!photos || photos.length === 0) {
		return (
			<View style={{flex: 1}}>
				<FlatList
					data={[]}
					renderItem={() => null}
					ListHeaderComponent={headerComponent}
					refreshControl={
						onRefresh ? (
							<RefreshControl
								refreshing={isRefreshing || false}
								onRefresh={onRefresh}
							/>
						) : undefined
					}
					contentContainerStyle={{flex: 1}}
				/>
				<View style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					justifyContent: 'center',
					alignItems: 'center',
					padding: 24
				}}>
					<EmptyState/>
				</View>
			</View>
		)
	}

	return (
		<View style={{flex: 1, position: 'relative'}}>
			<FlatList
				data={[{key: 'masonry-container'}]} // Single item to enable scrolling
				renderItem={() => (
					<View style={{height: totalHeight, position: 'relative'}}>
						{masonryPhotos.map((photo, index) => (
							<MasonryPhotoItem
								key={photo.id}
								photo={photo}
								memoryPhotos={renderablePhotos}
								photoIndex={index}
							/>
						))}
					</View>
				)}
				keyExtractor={(item) => item.key}
				onScroll={onScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: 100
				}}
				ListHeaderComponent={headerComponent}
				refreshControl={
					onRefresh ? (
						<RefreshControl
							refreshing={isRefreshing || false}
							onRefresh={onRefresh}
						/>
					) : undefined
				}
			/>
		</View>
	)
}
