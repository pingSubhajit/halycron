import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import {Photo} from './types'
import {downloadAndDecryptFile} from './crypto-utils'

export interface ShareResult {
	success: boolean
	message: string
}

export const shareImage = async (photo: Photo): Promise<ShareResult> => {
	let decryptedFilePath: string | null = null

	try {
		// Check if sharing is available
		const isAvailable = await Sharing.isAvailableAsync()
		if (!isAvailable) {
			return {
				success: false,
				message: 'Sharing is not available on this device.'
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
				message: 'Failed to prepare image for sharing.'
			}
		}

		// Share the decrypted file
		const shareResult = await Sharing.shareAsync(decryptedFilePath, {
			mimeType: photo.mimeType,
			dialogTitle: 'Share Photo'
		})

		/*
		 * Note: shareResult is typically undefined on success,
		 * and sharing cancellation doesn't throw an error
		 */

		// Clean up the temporary decrypted file after sharing
		try {
			await FileSystem.deleteAsync(decryptedFilePath, {idempotent: true})
		} catch (cleanupError) {
			console.warn('Failed to cleanup temporary shared file:', cleanupError)
			// Don't fail the operation if cleanup fails
		}

		return {
			success: true,
			message: 'Photo shared successfully!'
		}
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

		let errorMessage = 'Failed to share image.'

		if (error instanceof Error) {
			// Provide more specific error messages
			if (error.message.includes('decrypt')) {
				errorMessage = 'Failed to decrypt image. The image may be corrupted.'
			} else if (error.message.includes('download')) {
				errorMessage = 'Failed to prepare image. Please check your internet connection.'
			} else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
				// User cancellation shouldn't be treated as an error - return success
				return {
					success: true,
					message: 'Sharing was cancelled by user.'
				}
			} else {
				errorMessage = `Share failed: ${error.message}`
			}
		}

		return {
			success: false,
			message: errorMessage
		}
	}
}
