import React, {useEffect, useRef, useState} from 'react'
import {ActivityIndicator, Animated, Dimensions, PanResponder, Text, View} from 'react-native'
import {Image} from 'expo-image'
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

	// Animation values
	const scale = useRef(new Animated.Value(1)).current
	const translateX = useRef(new Animated.Value(0)).current
	const translateY = useRef(new Animated.Value(0)).current

	// Tracking values
	const lastScale = useRef(1)
	const lastTranslateX = useRef(0)
	const lastTranslateY = useRef(0)

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

	// Create pan responder for gestures
	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				// Store current values when gesture starts
				scale.setOffset(lastScale.current)
				scale.setValue(1)
				translateX.setOffset(lastTranslateX.current)
				translateX.setValue(0)
				translateY.setOffset(lastTranslateY.current)
				translateY.setValue(0)
			},
			onPanResponderMove: (evt, gestureState) => {
				// Handle single finger pan (when already zoomed)
				if (evt.nativeEvent.touches.length === 1 && lastScale.current > 1) {
					translateX.setValue(gestureState.dx)
					translateY.setValue(gestureState.dy)
				}
				// Handle pinch zoom
				else if (evt.nativeEvent.touches.length === 2) {
					const touch1 = evt.nativeEvent.touches[0]
					const touch2 = evt.nativeEvent.touches[1]

					if (touch1 && touch2) {
						const distance = Math.sqrt(
							Math.pow(touch2.pageX - touch1.pageX, 2) +
							Math.pow(touch2.pageY - touch1.pageY, 2)
						)

						// Simple pinch scaling (you could make this more sophisticated)
						const newScale = Math.max(0.5, Math.min(3, distance / 200))
						scale.setValue(newScale)
					}
				}
			},
			onPanResponderRelease: () => {
				// Update last values
				scale.flattenOffset()
				translateX.flattenOffset()
				translateY.flattenOffset()

				// Get current values
				const currentScale = (scale as any)._value
				const currentTranslateX = (translateX as any)._value
				const currentTranslateY = (translateY as any)._value

				// Bounds checking and snap back if needed
				if (currentScale < 1) {
					// Snap back to normal size
					Animated.parallel([
						Animated.spring(scale, {
							toValue: 1,
							useNativeDriver: true
						}),
						Animated.spring(translateX, {
							toValue: 0,
							useNativeDriver: true
						}),
						Animated.spring(translateY, {
							toValue: 0,
							useNativeDriver: true
						})
					]).start()
					lastScale.current = 1
					lastTranslateX.current = 0
					lastTranslateY.current = 0
				} else {
					// Constrain translation within bounds
					const maxTranslateX = ((currentScale - 1) * screenWidth) / 2
					const maxTranslateY = ((currentScale - 1) * screenHeight) / 2

					const constrainedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, currentTranslateX))
					const constrainedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, currentTranslateY))

					if (constrainedX !== currentTranslateX || constrainedY !== currentTranslateY) {
						Animated.parallel([
							Animated.spring(translateX, {
								toValue: constrainedX,
								useNativeDriver: true
							}),
							Animated.spring(translateY, {
								toValue: constrainedY,
								useNativeDriver: true
							})
						]).start()
					}

					lastScale.current = currentScale
					lastTranslateX.current = constrainedX
					lastTranslateY.current = constrainedY
				}
			}
		})
	).current

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
			backgroundColor: darkTheme.dark,
			justifyContent: 'center',
			alignItems: 'center'
		}}>
			<Animated.View
				{...panResponder.panHandlers}
				style={{
					transform: [
						{scale},
						{translateX},
						{translateY}
					]
				}}
			>
				<Image
					source={{uri: decryptedUrl}}
					style={{
						width: screenWidth - 32,
						height: screenHeight - 200, // Account for header and safe areas
						maxWidth: screenWidth - 32,
						maxHeight: screenHeight - 200
					}}
					contentFit="contain"
					transition={200}
					cachePolicy="disk"
					recyclingKey={`shared_photo_${photo.id}`}
				/>
			</Animated.View>

			{/* Photo info */}
			<View style={{
				position: 'absolute',
				bottom: 20,
				left: 20,
				right: 20,
				backgroundColor: 'rgba(0,0,0,0.7)',
				borderRadius: 8,
				padding: 12
			}}>
				<Text style={{
					color: darkTheme.foreground,
					fontSize: 14,
					fontWeight: '600'
				}}>
					{photo.originalFilename}
				</Text>
				{photo.imageWidth && photo.imageHeight && (
					<Text style={{
						color: darkTheme.mutedForeground,
						fontSize: 12,
						marginTop: 4
					}}>
						{photo.imageWidth} × {photo.imageHeight}
					</Text>
				)}
			</View>
		</View>
	)
}
