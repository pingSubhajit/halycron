import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import {Photo} from './types'
import {downloadAndDecryptFile} from './crypto-utils'

export interface DownloadResult {
	success: boolean
	message: string
	asset?: MediaLibrary.Asset
}

// Utility function to check if MediaLibrary is available
const checkMediaLibraryAvailability = async (): Promise<boolean> => {
	try {
		const isAvailable = await MediaLibrary.isAvailableAsync()
		return isAvailable
	} catch (error) {
		console.error('Failed to check MediaLibrary availability:', error)
		return false
	}
}

// Utility function for debugging - call this to reset permissions for testing
export const resetPermissionsForTesting = async (): Promise<void> => {
	try {
		const isAvailable = await checkMediaLibraryAvailability()

		if (isAvailable) {
			const permissions = await MediaLibrary.getPermissionsAsync()
		}
	} catch (error) {
		console.error('Debug info failed:', error)
	}
}

const requestPermissionsWithRetry = async (): Promise<MediaLibrary.PermissionResponse> => {
	// Check current permission status
	let permissionResponse = await MediaLibrary.getPermissionsAsync()

	if (!permissionResponse.granted) {
		// Try multiple approaches
		try {
			// First try: granular permissions for photos only
			try {
				permissionResponse = await MediaLibrary.requestPermissionsAsync(
					true, // writeOnly
					['photo'] // granularPermissions - only request photo access
				)
			} catch (granularError) {
				// Fallback to regular permission request if granular fails
				permissionResponse = await MediaLibrary.requestPermissionsAsync(true)
			}

			// If still not granted, try full permissions as last resort
			if (!permissionResponse.granted && permissionResponse.canAskAgain) {
				permissionResponse = await MediaLibrary.requestPermissionsAsync(false)
			}
		} catch (error) {
			console.error('Permission request failed:', error)
		}
	}

	return permissionResponse
}


export const downloadImageToGallery = async (photo: Photo): Promise<DownloadResult> => {
	let decryptedFilePath: string | null = null

	try {
		// Check if MediaLibrary is available
		const isAvailable = await checkMediaLibraryAvailability()
		if (!isAvailable) {
			return {
				success: false,
				message: 'Media library is not available on this device.'
			}
		}

		// Get the decrypted file path using existing crypto utils
		decryptedFilePath = await downloadAndDecryptFile(
			photo.url,
			photo.encryptedFileKey,
			photo.fileKeyIv,
			photo.mimeType,
			photo.id
		)

		// Ensure the file exists
		const fileInfo = await FileSystem.getInfoAsync(decryptedFilePath)
		if (!fileInfo.exists) {
			return {
				success: false,
				message: 'Failed to decrypt image file.'
			}
		}

		// Request permissions
		const permissionResponse = await requestPermissionsWithRetry()

		if (!permissionResponse.granted) {
			let message = 'Permission to save photos is required to download images.'

			if (permissionResponse.canAskAgain === false) {
				message = 'Photo library permission was denied. Please enable it in Settings > Apps > Halycron > Permissions.'
			} else if (permissionResponse.status === 'denied') {
				message = 'Permission was denied. Please try again or enable it manually in Settings.'
			} else {
				message = `Permission status: ${permissionResponse.status}. Please enable photo access in Settings.`
			}

			return {
				success: false,
				message
			}
		}

		// Try to get or create Halycron album first
		let result: DownloadResult

		try {
			const albums = await MediaLibrary.getAlbumsAsync()
			let album = albums.find(a => a.title === 'Halycron')

			if (!album) {
				// Create album by first saving an asset, then creating album with it
				const asset = await MediaLibrary.createAssetAsync(decryptedFilePath)
				album = await MediaLibrary.createAlbumAsync('Halycron', asset, false)

				result = {
					success: true,
					message: 'Image saved to new Halycron album successfully!',
					asset
				}
			} else {
				// Create asset directly in the existing album
				const asset = await MediaLibrary.createAssetAsync(decryptedFilePath, album)

				result = {
					success: true,
					message: 'Image saved to Halycron album successfully!',
					asset
				}
			}
		} catch (albumError) {
			// If album operations fail, fall back to regular save
			try {
				const asset = await MediaLibrary.createAssetAsync(decryptedFilePath)
				result = {
					success: true,
					message: 'Image saved to gallery successfully!',
					asset
				}
			} catch (saveError) {
				// Last resort: use saveToLibraryAsync
				await MediaLibrary.saveToLibraryAsync(decryptedFilePath)
				result = {
					success: true,
					message: 'Image saved to gallery successfully!'
				}
			}
		}

		// Clean up the temporary decrypted file to free memory/storage
		try {
			await FileSystem.deleteAsync(decryptedFilePath, {idempotent: true})
		} catch (cleanupError) {
			console.warn('Failed to cleanup temporary decrypted file:', cleanupError)
			// Don't fail the operation if cleanup fails
		}

		return result
	} catch (error) {
		// Clean up temporary file if it exists, even on error
		if (decryptedFilePath) {
			try {
				const fileInfo = await FileSystem.getInfoAsync(decryptedFilePath)
				if (fileInfo.exists) {
					await FileSystem.deleteAsync(decryptedFilePath, {idempotent: true})
				}
			} catch (cleanupError) {
				console.warn('Failed to cleanup temporary file on error:', cleanupError)
			}
		}

		let errorMessage = 'Failed to download image.'

		if (error instanceof Error) {
			// Provide more specific error messages
			if (error.message.includes('decrypt')) {
				errorMessage = 'Failed to decrypt image. The image may be corrupted.'
			} else if (error.message.includes('download')) {
				errorMessage = 'Failed to download image. Please check your internet connection.'
			} else if (error.message.includes('permission')) {
				errorMessage = 'Permission denied. Please allow photo access in Settings.'
			} else {
				errorMessage = `Download failed: ${error.message}`
			}
		}

		return {
			success: false,
			message: errorMessage
		}
	}
}
