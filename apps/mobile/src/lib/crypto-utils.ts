import crypto from 'react-native-quick-crypto'
import {Buffer} from 'buffer'
import {fileCacheManager} from './file-cache-manager'

// Cache algorithm lookup to avoid repeated switch statements
const getAlgorithmForKeyLength = (() => {
	const cache = new Map<number, 'aes-128-cbc' | 'aes-192-cbc' | 'aes-256-cbc'>()
	cache.set(16, 'aes-128-cbc')
	cache.set(24, 'aes-192-cbc')
	cache.set(32, 'aes-256-cbc')

	return (keyLength: number) => {
		const algorithm = cache.get(keyLength)
		if (!algorithm) {
			throw new Error(`Unsupported key length: ${keyLength}`)
		}
		return algorithm
	}
})()

export const downloadAndDecryptFile = async (fileUrl: string, key: string, iv: string, mimeType: string, id: string) => {
	try {
		// Check if we have a cached file first
		const cachedFilePath = await fileCacheManager.getCachedFile(id, fileUrl)
		if (cachedFilePath) {
			return cachedFilePath
		}

		// Pre-parse key and IV to avoid doing it in the decrypt function
		const keyBuffer = Buffer.from(key, 'base64')
		const ivBuffer = Buffer.from(iv, 'hex')
		const algorithm = getAlgorithmForKeyLength(keyBuffer.length)

		// Download the encrypted file
		const response = await fetch(fileUrl)
		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.status}`)
		}

		// Get ArrayBuffer directly instead of blob
		const encryptedArrayBuffer = await response.arrayBuffer()
		const encryptedData = Buffer.from(encryptedArrayBuffer)

		// Decrypt directly without intermediate blob conversion
		const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer)
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
