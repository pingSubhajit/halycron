import React, {useEffect, useState} from 'react'
import {ActivityIndicator, Dimensions, Text, View} from 'react-native'
import {ImageZoom} from '@likashefqet/react-native-image-zoom'
import {Photo as SharedPhoto} from '@/src/lib/shared-api'
import {darkTheme} from '@/src/theme/theme'
import {downloadAndDecryptFile} from '@/src/lib/crypto-utils'

interface SharedPhotoViewProps {
	photo: SharedPhoto
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window')

export const SharedPhotoView: React.FC<SharedPhotoViewProps> = ({photo}) => {
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Decrypt the image
	useEffect(() => {
		const decryptImage = async () => {
			try {
				setIsLoading(true)
				setError(null)

				if (photo.encryptedFileKey && photo.fileKeyIv) {
					const url = await downloadAndDecryptFile(
						photo.url,
						photo.encryptedFileKey,
						photo.fileKeyIv,
						photo.mimeType,
						photo.id
					)
					setDecryptedUrl(url)
				} else {
					// For non-encrypted images
					setDecryptedUrl(photo.url)
				}
			} catch (error) {
				console.error('Failed to decrypt image:', error)
				setError('Failed to load image')
			} finally {
				setIsLoading(false)
			}
		}

		decryptImage()
	}, [photo])

	if (isLoading) {
		return (
			<View style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: darkTheme.dark
			}}>
				<ActivityIndicator size="large" color={darkTheme.primary}/>
				<Text style={{
					color: darkTheme.mutedForeground,
					fontSize: 14,
					marginTop: 8
				}}>
					Decrypting photo...
				</Text>
			</View>
		)
	}

	if (error || !decryptedUrl) {
		return (
			<View style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: darkTheme.dark,
				padding: 20
			}}>
				<Text style={{
					color: '#dc2626',
					fontSize: 16,
					textAlign: 'center'
				}}>
					{error || 'Unable to display image'}
				</Text>
			</View>
		)
	}

	return (
		<View style={{
			flex: 1,
			backgroundColor: darkTheme.dark
		}}>
			<ImageZoom
				uri={decryptedUrl}
				minScale={1}
				maxScale={5}
				doubleTapScale={2}
				maxPanPointers={2}
				isPanEnabled={true}
				isPinchEnabled={true}
				isDoubleTapEnabled={true}
				style={{
					width: screenWidth,
					height: screenHeight - 200 // Account for header and safe areas
				}}
				resizeMode="contain"
			/>
		</View>
	)
}
