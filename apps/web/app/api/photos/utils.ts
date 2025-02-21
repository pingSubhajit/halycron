import {api} from '@/lib/data/api-client'
import {Photo} from '@/app/api/photos/types'

export const generateEncryptionKey = () => {
	// Generate 32 random bytes (256 bits) and convert to base64
	const randomBytes = window.crypto.getRandomValues(new Uint8Array(32))
	return btoa(String.fromCharCode(...randomBytes))
}

export const encryptFile = async (file: File, encryptionKey: string) => {
	const subtle = window.crypto.subtle
	const iv = window.crypto.getRandomValues(new Uint8Array(16))

	// Convert base64 key back to bytes
	const keyBytes = Uint8Array.from(atob(encryptionKey), c => c.charCodeAt(0))

	// Import the key
	const cryptoKey = await subtle.importKey(
		'raw',
		keyBytes,
		{name: 'AES-CBC', length: 256},
		false,
		['encrypt']
	)

	// Encrypt the file
	const arrayBuffer = await file.arrayBuffer()
	const encryptedData = await subtle.encrypt(
		{name: 'AES-CBC', iv},
		cryptoKey,
		arrayBuffer
	)

	const encryptedBlob = new Blob([encryptedData], {type: file.type})

	return {
		encryptedFile: new File([encryptedBlob], file.name, {type: file.type}),
		iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''), // Convert to hex string
		key: encryptionKey
	}
}

export const decryptFile = async (encryptedBlob: Blob, key: string, iv: string) => {
	const subtle = window.crypto.subtle

	// Convert hex IV back to Uint8Array
	const ivArray = new Uint8Array(iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

	// Convert base64 key back to bytes
	const keyBytes = Uint8Array.from(atob(key), c => c.charCodeAt(0))

	// Import the key
	const cryptoKey = await subtle.importKey(
		'raw',
		keyBytes,
		{name: 'AES-CBC', length: 256},
		false,
		['decrypt']
	)

	// Decrypt the data
	const encryptedData = await encryptedBlob.arrayBuffer()
	const decryptedData = await subtle.decrypt(
		{name: 'AES-CBC', iv: ivArray},
		cryptoKey,
		encryptedData
	)

	return decryptedData
}

export const downloadAndDecryptFile = async (fileUrl: string, key: string, iv: string, mimeType: string) => {
	// Download the encrypted file
	const response = await fetch(fileUrl)
	const encryptedBlob = await response.blob()

	// Decrypt the file
	const decryptedData = await decryptFile(encryptedBlob, key, iv)

	// Create a blob from the decrypted data
	const decryptedBlob = new Blob([decryptedData], {type: mimeType})

	// Create a download link
	return URL.createObjectURL(decryptedBlob)
}

export const getImageDimensions = (file: File): Promise<{width: number; height: number}> => {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => {
			resolve({width: img.width, height: img.height})
		}
		img.onerror = reject
		img.src = URL.createObjectURL(file)
	})
}

export const getPreSignedUploadUrl = async (name: string, type: string) => {
	const response = await api.post<{uploadUrl: string, fileKey: string}>('/api/photos/upload-url', {
		fileName: name,
		contentType: type
	})

	return {uploadUrl: response.uploadUrl, fileKey: response.fileKey}
}

export const uploadEncryptedPhoto = async (file: File, uploadUrl: string) => {
	const uploadResponse = await fetch(uploadUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
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
		encryptedKey: key,
		keyIv: iv,
		originalFilename: name,
		mimeType,
		imageWidth,
		imageHeight
	}) as Photo
}

export const deletePhoto = async (photoId: string) => {
	const response = await fetch('/api/photos', {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({photoId})
	})

	if (!response.ok) {
		throw new Error('Failed to delete photo')
	}

	return response.json()
}

