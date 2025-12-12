import crypto from 'react-native-quick-crypto'
import {Buffer} from 'buffer'
import {Image} from 'react-native'
import * as FileSystem from 'expo-file-system'
import {api} from './api-client'
import {Photo} from './types'
import {base64ToUint8Array, uint8ArrayToBase64} from './base64-utils'

export const generateEncryptionKey = () => {
	// Generate 32 random bytes (256 bits) and convert to base64
	const randomBytes = crypto.randomBytes(32)
	// Convert to Uint8Array and use our reliable base64 encoder
	const uint8Array = new Uint8Array(randomBytes)
	return uint8ArrayToBase64(uint8Array)
}

export const encryptFile = async (fileUri: string, encryptionKey: string) => {
	// Generate a random IV (12 bytes for AES-GCM - recommended size)
	const iv = crypto.randomBytes(12)

	// Convert base64 key back to bytes using our reliable decoder
	const keyUint8 = base64ToUint8Array(encryptionKey)
	const keyBuffer = Buffer.from(keyUint8)

	// Read the file as buffer
	const response = await fetch(fileUri)
	if (!response.ok) {
		throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
	}

	const arrayBuffer = await response.arrayBuffer()
	const fileBuffer = Buffer.from(arrayBuffer)

	// Create cipher and encrypt using AES-256-GCM
	const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv)
	const encrypted = Buffer.concat([
		cipher.update(fileBuffer),
		cipher.final()
	])

	// Get the authentication tag (16 bytes) and append to ciphertext
	const authTag = cipher.getAuthTag()
	const encryptedData = Buffer.concat([encrypted, authTag])

	return {
		encryptedData,
		iv: iv.toString('hex'), // Convert to hex string (24 chars for 12 bytes)
		key: encryptionKey
	}
}

export const getImageDimensions = async (fileUri: string): Promise<{ width: number; height: number }> => {
	return new Promise((resolve, reject) => {
		Image.getSize(
			fileUri,
			(width: number, height: number) => {
				resolve({width, height})
			},
			(error: any) => {
				console.warn('Failed to get image dimensions:', error)
				// Fallback to default dimensions if we can't get the real ones
				resolve({width: 1920, height: 1080})
			}
		)
	})
}

export const getPreSignedUploadUrl = async (name: string, type: string) => {
	const response = await api.post<{ uploadUrl: string, fileKey: string }>('/api/photos/upload-url', {
		fileName: name,
		contentType: type
	})

	return {uploadUrl: response.uploadUrl, fileKey: response.fileKey}
}

export const uploadEncryptedPhoto = async (encryptedData: Buffer, uploadUrl: string, contentType: string) => {
	// Create a temp file path for the encrypted data
	const tempFilePath = `${FileSystem.cacheDirectory}encrypted_upload_${Date.now()}.bin`

	try {
		// Write encrypted data to temp file as base64
		const base64Data = uint8ArrayToBase64(new Uint8Array(encryptedData))
		await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
			encoding: FileSystem.EncodingType.Base64
		})

		// Upload using FileSystem.uploadAsync
		const uploadResult = await FileSystem.uploadAsync(uploadUrl, tempFilePath, {
			httpMethod: 'PUT',
			uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
			headers: {
				'Content-Type': contentType,
				'x-amz-server-side-encryption': 'AES256'
			}
		})

		if (uploadResult.status < 200 || uploadResult.status >= 300) {
			throw new Error(`Upload failed: ${uploadResult.status}`)
		}

		return uploadResult
	} finally {
		// Clean up temp file
		try {
			await FileSystem.deleteAsync(tempFilePath, {idempotent: true})
		} catch (cleanupError) {
			// Ignore cleanup errors
		}
	}
}

export const savePhotoToDB = async (
	fileKey: string,
	key: string,
	iv: string,
	name: string,
	mimeType: string,
	imageWidth?: number,
	imageHeight?: number
) => {
	return await api.post('/api/photos', {
		fileKey,
		encryptedFileKey: key,
		fileKeyIv: iv,
		originalFilename: name,
		mimeType,
		imageWidth,
		imageHeight
	}) as Photo
}
