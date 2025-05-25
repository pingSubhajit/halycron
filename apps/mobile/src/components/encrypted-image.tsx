import React from 'react'
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'
import {Photo} from '@/src/lib/types'
import {useDecryptedUrl} from '@/src/hooks/use-decrypted-url'
import {useThumbnail} from '@/src/hooks/use-thumbnail'
import {cn} from '@/lib/utils'
import {darkTheme} from '@/src/theme/theme'
import {usePhotoViewer} from '@/src/components/dialog-provider'

type Props = {
	photo: Photo
	style?: any
	className?: string
	shouldUseThumbnail?: boolean
}

const ImageSkeleton = ({className, style}: { className?: string, style?: any }) => (
	<View
		style={[
			{
				backgroundColor: darkTheme.accent,
				aspectRatio: 4 / 3,
				justifyContent: 'center',
				alignItems: 'center'
			},
			style
		]}
		className={cn('aspect-video justify-center items-center', className)}
	>
		<ActivityIndicator size="small" color={darkTheme.accentForeground}/>
	</View>
)

const ErrorState = ({className, style}: { className?: string, style?: any }) => (
	<View
		style={[
			{
				backgroundColor: darkTheme.accent,
				aspectRatio: 4 / 3,
				justifyContent: 'center',
				alignItems: 'center',
				padding: 16
			},
			style
		]}
		className={cn('bg-accent aspect-video justify-center items-center p-4', className)}
	>
		<Text style={{color: '#dc2626', textAlign: 'center', fontSize: 14}}>
			Failed to load image
		</Text>
	</View>
)

const ThumbnailGeneratingState = ({style}: { style?: any }) => (
	<View
		style={[
			{
				backgroundColor: darkTheme.accent,
				justifyContent: 'center',
				alignItems: 'center'
			},
			style
		]}
	>
		<ActivityIndicator size="small" color={darkTheme.accentForeground}/>
		<Text style={{color: darkTheme.accentForeground, fontSize: 12, marginTop: 4}}>
			Optimizing...
		</Text>
	</View>
)

export const EncryptedImage = React.memo(({photo, style, className, shouldUseThumbnail = false}: Props) => {
	const thumbnailResult = useThumbnail(shouldUseThumbnail ? photo : null)
	const fullSizeResult = useDecryptedUrl(!shouldUseThumbnail ? photo : null)

	const {
		thumbnailUrl,
		isLoadingThumbnail,
		isGeneratingThumbnail,
		error: thumbnailError
	} = thumbnailResult

	const {
		decryptedUrl: fullSizeUrl,
		isLoading: isLoadingFullSize,
		error: fullSizeError
	} = fullSizeResult

	const {openPhotoViewer} = usePhotoViewer()

	const imageUrl = shouldUseThumbnail ? thumbnailUrl : fullSizeUrl
	const isLoading = shouldUseThumbnail ? isLoadingThumbnail : isLoadingFullSize
	const error = shouldUseThumbnail ? thumbnailError : fullSizeError

	const handleImagePress = () => {
		openPhotoViewer(photo)
	}

	if (error) {
		return <ErrorState style={style}/>
	}

	if (shouldUseThumbnail && isGeneratingThumbnail && !thumbnailUrl) {
		return (
			<ThumbnailGeneratingState
				style={[
					style,
					{
						aspectRatio: photo.imageWidth && photo.imageHeight
							? photo.imageWidth / photo.imageHeight
							: 4 / 3
					}
				]}
			/>
		)
	}

	if (isLoading || !imageUrl) {
		return (
			<ImageSkeleton
				style={[
					style,
					{
						aspectRatio: photo.imageWidth && photo.imageHeight
							? photo.imageWidth / photo.imageHeight
							: 4 / 3
					}
				]}
			/>
		)
	}

	return (
		<TouchableOpacity
			activeOpacity={0.9}
			style={style}
			className={className}
			onPress={handleImagePress}
		>
			<Image
				source={{uri: imageUrl}}
				style={{
					aspectRatio: photo.imageWidth && photo.imageHeight
						? photo.imageWidth / photo.imageHeight
						: 4 / 3
				}}
				contentFit="cover"
				transition={200}
				className="w-full"
				cachePolicy="disk"
				recyclingKey={`${photo.id}_${shouldUseThumbnail ? 'thumb' : 'full'}`}
			/>
		</TouchableOpacity>
	)
})

EncryptedImage.displayName = 'EncryptedImage'
