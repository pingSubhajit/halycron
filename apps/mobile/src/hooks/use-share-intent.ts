import {useEffect} from 'react'
import {useShareIntent} from 'expo-share-intent'
import {useUploadContext} from '@/src/components/upload-provider'
import {getImageDimensions} from '@/src/lib/upload-utils'
import * as ImagePicker from 'expo-image-picker'

interface UseAppShareIntentOptions {
	onSharedPhotosReceived?: (photos: ImagePicker.ImagePickerAsset[]) => void
}

// Helper function to check if a URL is likely an image
const isLikelyImageUrl = (url: string): boolean => {
	if (!url || typeof url !== 'string') return false

	// Photo/image extensions only - no video formats
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico', '.heic', '.heif', '.avif', '.raw', '.cr2', '.nef', '.dng']
	const imageHosts = ['imgur.com', 'i.imgur.com', 'cdn.discordapp.com', 'media.discordapp.net', 'i.redd.it', 'preview.redd.it', 'images.unsplash.com', 'pexels.com']

	const lowerUrl = url.toLowerCase()

	// Check for direct image file extensions
	if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
		return true
	}

	// Check for known image hosting domains
	if (imageHosts.some(host => lowerUrl.includes(host))) {
		return true
	}

	// Check for common image URL patterns
	if (lowerUrl.includes('/image/') || lowerUrl.includes('/img/') || lowerUrl.includes('/photo/')) {
		return true
	}

	return false
}

export const useAppShareIntent = ({onSharedPhotosReceived}: UseAppShareIntentOptions = {}) => {
	const {hasShareIntent, shareIntent, resetShareIntent, error} = useShareIntent()
	const {uploadSharedPhotos} = useUploadContext()

	useEffect(() => {
		if (hasShareIntent && shareIntent) {
			handleShareIntent()
		}
	}, [hasShareIntent, shareIntent])

	const handleShareIntent = async () => {
		if (!shareIntent) return

		try {
			// Handle shared files (images only)
			if (shareIntent.files && shareIntent.files.length > 0) {
				const imageFiles = shareIntent.files.filter(file => file.mimeType?.startsWith('image/'))

				// Get actual dimensions for each image
				const photoAssets: ImagePicker.ImagePickerAsset[] = await Promise.all(
					imageFiles.map(async (file) => {
						try {
							// Get actual image dimensions
							const dimensions = await getImageDimensions(file.path)

							return {
								uri: file.path,
								fileName: file.fileName || `shared_${Date.now()}.jpg`,
								mimeType: file.mimeType || 'image/jpeg',
								width: dimensions.width,
								height: dimensions.height,
								assetId: null,
								duration: null, // Always null for images
								type: 'image',
								fileSize: file.size || null,
								exif: null,
								base64: null
							} as ImagePicker.ImagePickerAsset
						} catch (error) {
							console.warn('Failed to get dimensions for shared image:', file.path, error)
							// Fallback to file dimensions or defaults if dimension fetching fails
							return {
								uri: file.path,
								fileName: file.fileName || `shared_${Date.now()}.jpg`,
								mimeType: file.mimeType || 'image/jpeg',
								width: file.width || 1920,
								height: file.height || 1080,
								assetId: null,
								duration: null,
								type: 'image',
								fileSize: file.size || null,
								exif: null,
								base64: null
							} as ImagePicker.ImagePickerAsset
						}
					})
				)

				if (photoAssets.length > 0) {
					// Notify about received photos
					onSharedPhotosReceived?.(photoAssets)

					// Auto-upload the shared photos using existing upload system
					await uploadSharedPhotos(photoAssets)
				}
			}

			// Handle shared text/URLs - only process if it's likely an image URL
			if (shareIntent.text) {
				const text = shareIntent.text.trim()
				if (isLikelyImageUrl(text)) {
					// TODO: Could implement URL-to-image download functionality here
				}
			}

			if (shareIntent.webUrl) {
				if (isLikelyImageUrl(shareIntent.webUrl)) {
					// TODO: Could implement URL-to-image download functionality here
				}
			}

			// Reset the share intent after processing
			resetShareIntent()
		} catch (error) {
			console.error('Error handling share intent:', error)
			resetShareIntent()
		}
	}

	return {
		hasShareIntent,
		shareIntent,
		error,
		resetShareIntent
	}
}
