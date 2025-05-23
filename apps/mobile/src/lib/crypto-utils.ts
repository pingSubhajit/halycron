import CryptoJS from 'crypto-js'

const blobToBase64 = (blob: Blob): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			// Remove data URL prefix to get just the base64 string
			const base64 = result.split(',')[1]
			resolve(base64!)
		}
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
	const bytes = new Uint8Array(buffer)
	let binary = ''
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]!)
	}
	return btoa(binary)
}

export const decryptFile = async (encryptedBlob: Blob, key: string, iv: string) => {
	try {
		// Convert blob to base64 string (React Native compatible)
		const encryptedBase64 = await blobToBase64(encryptedBlob)

		// Convert base64 key to WordArray
		const keyWordArray = CryptoJS.enc.Base64.parse(key)

		// Convert hex IV to WordArray
		const ivWordArray = CryptoJS.enc.Hex.parse(iv)

		// Decrypt using AES-CBC
		const decrypted = CryptoJS.AES.decrypt(
			encryptedBase64,
			keyWordArray,
			{
				iv: ivWordArray,
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7
			}
		)

		// Convert back to ArrayBuffer
		const decryptedArray = new Uint8Array(decrypted.sigBytes)
		const words = decrypted.words

		for (let i = 0; i < decrypted.sigBytes; i++) {
			decryptedArray[i] = (words[i >>> 2]! >>> (24 - (i % 4) * 8)) & 0xff
		}

		return decryptedArray.buffer
	} catch (error) {
		console.error('Decryption failed:', error)
		throw new Error('Failed to decrypt file')
	}
}

export const downloadAndDecryptFile = async (fileUrl: string, key: string, iv: string, mimeType: string, id: string) => {
	try {
		// Download the encrypted file
		const response = await fetch(fileUrl)
		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.status}`)
		}

		const encryptedBlob = await response.blob()

		// Decrypt the file
		const decryptedData = await decryptFile(encryptedBlob, key, iv)

		// Convert ArrayBuffer to base64 and create data URL (React Native compatible)
		const base64Data = arrayBufferToBase64(decryptedData)
		return `data:${mimeType};base64,${base64Data}`
	} catch (error) {
		console.error('Download and decrypt failed:', error)
		throw error
	}
}
