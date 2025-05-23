import React from 'react'
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'
import {Photo} from '@/src/lib/types'
import {useDecryptedUrl} from '@/src/hooks/use-decrypted-url'

type Props = {
	photo: Photo
	style?: any
	className?: string
}

const ImageSkeleton = ({style}: { style?: any }) => (
	<View
		style={[
			{
				backgroundColor: '#f3f4f6',
				aspectRatio: 4 / 3,
				justifyContent: 'center',
				alignItems: 'center',
				borderRadius: 8
			},
			style
		]}
	>
		<ActivityIndicator size="large" color="#6b7280"/>
	</View>
)

const ErrorState = ({style}: { style?: any }) => (
	<View
		style={[
			{
				backgroundColor: '#fee2e2',
				aspectRatio: 4 / 3,
				justifyContent: 'center',
				alignItems: 'center',
				borderRadius: 8,
				padding: 16
			},
			style
		]}
	>
		<Text style={{color: '#dc2626', textAlign: 'center', fontSize: 14}}>
			Failed to load image
		</Text>
	</View>
)

export const EncryptedImage = ({photo, style, className}: Props) => {
	const {decryptedUrl, isLoading, error} = useDecryptedUrl(photo)

	if (error) {
		console.log('Decryption error:', error)
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
		>
			<Image
				source={{uri: decryptedUrl}}
				style={{
					width: '100%',
					aspectRatio: photo.imageWidth && photo.imageHeight
						? photo.imageWidth / photo.imageHeight
						: 4 / 3,
					borderRadius: 8
				}}
				contentFit="cover"
				transition={200}
			/>
		</TouchableOpacity>
	)
}
