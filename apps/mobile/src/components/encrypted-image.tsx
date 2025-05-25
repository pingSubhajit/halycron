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
	loadDelay?: number // Delay in milliseconds before starting to load
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

const PlaceholderState = ({style}: { style?: any }) => (
	<View
		style={[
			{
				backgroundColor: '#1a1a1a',
				justifyContent: 'center',
				alignItems: 'center',
				borderRadius: 8
			},
			style
		]}
	>
		{/* Empty placeholder while waiting for load delay */}
	</View>
)

export const EncryptedImage = React.memo(({
	photo,
	style,
	className,
	shouldUseThumbnail = false,
	loadDelay = 0
}: Props) => {
	const [shouldStartLoading, setShouldStartLoading] = React.useState(loadDelay === 0)

	// Start loading after the specified delay
	React.useEffect(() => {
		if (loadDelay > 0) {
			const timer = setTimeout(() => {
				setShouldStartLoading(true)
			}, loadDelay)

			return () => clearTimeout(timer)
		}
	}, [loadDelay])

	// Only start loading when shouldStartLoading is true
	const photoToLoad = shouldStartLoading ? photo : null

	// Use thumbnail hook for gallery view, full-size for detailed view
	const thumbnailResult = useThumbnail(shouldUseThumbnail ? photoToLoad : null)
	const fullSizeResult = useDecryptedUrl(!shouldUseThumbnail ? photoToLoad : null)

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

	// Determine what to display
	const imageUrl = shouldUseThumbnail ? thumbnailUrl : fullSizeUrl
	const isLoading = shouldUseThumbnail ? isLoadingThumbnail : isLoadingFullSize
	const error = shouldUseThumbnail ? thumbnailError : fullSizeError

	const handleImagePress = () => {
		// Always open full-size image in viewer, regardless of thumbnail usage
		openPhotoViewer(photo)
	}

	// Show placeholder while waiting for load delay
	if (!shouldStartLoading) {
		return (
			<PlaceholderState
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

	if (error) {
		return <ErrorState style={style}/>
	}

	// Show thumbnail generation state
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
