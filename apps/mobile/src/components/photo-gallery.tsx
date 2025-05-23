import React from 'react'
import {Dimensions, ScrollView, Text, View} from 'react-native'
import {Photo} from '../lib/types'
import {EncryptedImage} from './encrypted-image'

type Props = {
	photos: Photo[]
	isLoading?: boolean
	error?: string | null
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

type PhotoWithHeight = Photo & {
	calculatedHeight: number
}

const distributePhotosIntoColumns = (photos: Photo[]): PhotoWithHeight[][] => {
	// Calculate height for each photo based on aspect ratio
	const photosWithHeights: PhotoWithHeight[] = photos.map(photo => {
		const hasValidDimensions = photo.imageWidth != null && photo.imageHeight != null && photo.imageWidth > 0 && photo.imageHeight > 0

		const aspectRatio = hasValidDimensions
			? (photo.imageWidth as number) / (photo.imageHeight as number)
			: 1
		const calculatedHeight = COLUMN_WIDTH / aspectRatio

		return {
			...photo,
			calculatedHeight
		}
	})

	// Initialize columns
	const columns: PhotoWithHeight[][] = Array.from({length: COLUMNS}, () => [])
	const columnHeights = Array.from({length: COLUMNS}, () => 0)

	// Distribute photos to columns, always choosing the shortest column
	photosWithHeights.forEach(photo => {
		const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
		columns[shortestColumnIndex]!.push(photo)
		columnHeights[shortestColumnIndex]! += photo.calculatedHeight + PHOTO_MARGIN
	})

	return columns
}

export const PhotoGallery = ({photos, isLoading, error}: Props) => {
	if (isLoading) {
		return <LoadingState/>
	}

	if (error) {
		return <ErrorState error={error}/>
	}

	if (!photos || photos.length === 0) {
		return <EmptyState/>
	}

	const photoColumns = distributePhotosIntoColumns(photos)

	const renderColumn = (columnPhotos: PhotoWithHeight[], columnIndex: number) => (
		<View
			key={columnIndex}
			style={{
				flex: 1,
				paddingHorizontal: PHOTO_MARGIN / 2
			}}
		>
			{columnPhotos.map((photo, photoIndex) => (
				<View
					key={photo.id}
					style={{
						marginBottom: PHOTO_MARGIN
					}}
				>
					<EncryptedImage
						photo={photo}
						style={{
							width: COLUMN_WIDTH,
							height: photo.calculatedHeight
						}}
					/>
				</View>
			))}
		</View>
	)

	return (
		<ScrollView
			className="flex-1"
			contentContainerStyle={{
				padding: PHOTO_MARGIN / 2,
				paddingBottom: 100
			}}
			showsVerticalScrollIndicator={false}
		>
			<View className="flex-row items-start">
				{photoColumns.map((columnPhotos, columnIndex) => renderColumn(columnPhotos, columnIndex))}
			</View>
		</ScrollView>
	)
}
