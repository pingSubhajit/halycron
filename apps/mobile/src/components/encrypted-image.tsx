import React from 'react'
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'
import {Photo} from '@/src/lib/types'
import {useDecryptedUrl} from '@/src/hooks/use-decrypted-url'
import {cn} from '@/lib/utils'
import {darkTheme} from '@/src/theme/theme'
import {usePhotoViewer} from '@/src/components/dialog-provider'

type Props = {
	photo: Photo
	style?: any
	className?: string
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

export const EncryptedImage = ({photo, style, className}: Props) => {
	const {decryptedUrl, isLoading, error} = useDecryptedUrl(photo)
	const {openPhotoViewer} = usePhotoViewer()

	const handleImagePress = () => {
		if (decryptedUrl && !isLoading && !error) {
			openPhotoViewer(photo, decryptedUrl)
		}
	}

	if (error) {
		return <ErrorState style={style}/>
	}

	if (isLoading || !decryptedUrl) {
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
				source={{uri: decryptedUrl}}
				style={{
					aspectRatio: photo.imageWidth && photo.imageHeight
						? photo.imageWidth / photo.imageHeight
						: 4 / 3
				}}
				contentFit="cover"
				transition={200}
				className="w-full"
			/>
		</TouchableOpacity>
	)
}
