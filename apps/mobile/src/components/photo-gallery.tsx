import React from 'react'
import {ActivityIndicator, Dimensions, FlatList, Text, View} from 'react-native'
import {Photo} from '../lib/types'
import {EncryptedImage} from './encrypted-image'

type Props = {
	photos: Photo[]
	isLoading?: boolean
	error?: string | null
}

const {width: screenWidth} = Dimensions.get('window')
const PHOTO_MARGIN = 4
const PHOTOS_PER_ROW = 3
const PHOTO_SIZE = (screenWidth - (PHOTO_MARGIN * (PHOTOS_PER_ROW + 1))) / PHOTOS_PER_ROW

const LoadingState = () => (
	<View className="flex-1 justify-center items-center p-6">
		<ActivityIndicator size="large" color="#3b82f6"/>
		<Text className="text-foreground mt-4 text-center">
			Unlocking your memories...
		</Text>
	</View>
)

const ErrorState = ({error}: { error: string }) => (
	<View className="flex-1 justify-center items-center p-6">
		<Text className="text-foreground text-center">
			{error || 'Hmm, we ran into a hiccup loading your photos. Mind trying again?'}
		</Text>
	</View>
)

const EmptyState = () => (
	<View className="flex-1 justify-center items-center p-6">
		<Text className="text-foreground text-center text-lg font-medium mb-2">
			No photos yet
		</Text>
		<Text className="text-muted-foreground text-center">
			Upload your first photo to get started
		</Text>
	</View>
)

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

	const renderPhoto = ({item}: { item: Photo }) => (
		<View style={{margin: PHOTO_MARGIN / 2}}>
			<EncryptedImage
				photo={item}
				style={{
					width: PHOTO_SIZE,
					height: PHOTO_SIZE
				}}
			/>
		</View>
	)

	return (
		<FlatList
			data={photos}
			renderItem={renderPhoto}
			numColumns={PHOTOS_PER_ROW}
			keyExtractor={(item) => item.id}
			contentContainerStyle={{
				padding: PHOTO_MARGIN / 2,
				paddingBottom: 100 // Extra space at bottom
			}}
			showsVerticalScrollIndicator={false}
		/>
	)
}
