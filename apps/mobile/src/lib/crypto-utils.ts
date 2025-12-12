import crypto from 'react-native-quick-crypto'
import {Buffer} from 'buffer'
import {fileCacheManager} from './file-cache-manager'
import {base64ToUint8Array} from './base64-utils'

// Determine algorithm based on key length and IV length
// IV length determines mode: 12 bytes = GCM (new), 16 bytes = CBC (legacy)
const getAlgorithm = (keyLength: number, ivLength: number): string => {
	const isGCM = ivLength === 12
	const mode = isGCM ? 'gcm' : 'cbc'

	switch (keyLength) {
		case 16:
			return `aes-128-${mode}`
		case 24:
			return `aes-192-${mode}`
		case 32:
			return `aes-256-${mode}`
		default:
			throw new Error(`Unsupported key length: ${keyLength}`)
	}
}

export const downloadAndDecryptFile = async (fileUrl: string, key: string, iv: string, mimeType: string, id: string) => {
	try {
		// Check if we have a cached file first
		const cachedFilePath = await fileCacheManager.getCachedFile(id, fileUrl)
		if (cachedFilePath) {
			return cachedFilePath
		}

		// Pre-parse key and IV using reliable base64 decoder
		const keyUint8 = base64ToUint8Array(key)
		const keyBuffer = Buffer.from(keyUint8)
		const ivBuffer = Buffer.from(iv, 'hex')

		// Detect algorithm based on key and IV length
		const isGCM = ivBuffer.length === 12
		const algorithm = getAlgorithm(keyBuffer.length, ivBuffer.length)

		// Download the encrypted file
		const response = await fetch(fileUrl)
		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.status}`)
		}

		// Get ArrayBuffer directly instead of blob
		const encryptedArrayBuffer = await response.arrayBuffer()
		let encryptedData = Buffer.from(encryptedArrayBuffer)

		// Create decipher with detected algorithm
		const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer)

		// For GCM mode, extract auth tag from the last 16 bytes
		if (isGCM) {
			const authTag = encryptedData.slice(-16)
			encryptedData = encryptedData.slice(0, -16)
			decipher.setAuthTag(authTag)
		}

		// Decrypt the data
		const decryptedData = Buffer.concat([
			decipher.update(encryptedData) as Uint8Array,
			decipher.final() as Uint8Array
		])

		// Cache the decrypted file and return the file path
		const filePath = await fileCacheManager.cacheDecryptedFile(id, fileUrl, decryptedData, mimeType)
		return filePath
	} catch (error) {
		console.error('Download and decrypt failed:', error)
		throw error
	}
}
