import crypto from 'react-native-quick-crypto'
import {Buffer} from 'buffer'
import {Image} from 'react-native'
import {api} from './api-client'
import {Photo} from './types'

export const generateEncryptionKey = () => {
	// Generate 32 random bytes (256 bits) and convert to base64
	const randomBytes = crypto.randomBytes(32)
	return randomBytes.toString('base64')
}

export const encryptFile = async (fileUri: string, encryptionKey: string) => {
	// Generate a random IV (12 bytes for AES-GCM - recommended size)
	const iv = crypto.randomBytes(12)

	// Convert base64 key back to bytes
	const keyBuffer = Buffer.from(encryptionKey, 'base64')

	// Read the file as buffer
	const response = await fetch(fileUri)
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
	const uploadResponse = await fetch(uploadUrl, {
		method: 'PUT',
		body: encryptedData,
		headers: {
			'Content-Type': contentType,
			'x-amz-server-side-encryption': 'AES256'
		}
	})

	if (!uploadResponse.ok) {
		throw new Error('Upload failed')
	}

	return uploadResponse
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
