import {api} from '@/lib/data/api-client'
import {Photo} from '@/app/api/photos/types'

export const generatePhotoDek = () => {
	// Generate 32 random bytes (256 bits)
	return window.crypto.getRandomValues(new Uint8Array(32))
}

export const encryptFile = async (file: File, dek: Uint8Array) => {
	const subtle = window.crypto.subtle
	// Use 12-byte IV for AES-GCM (recommended size)
	const iv = window.crypto.getRandomValues(new Uint8Array(12))

	// Import the key for AES-GCM
	const cryptoKey = await subtle.importKey(
		'raw',
		dek,
		{name: 'AES-GCM', length: 256},
		false,
		['encrypt']
	)

	// Encrypt the file using AES-GCM (auth tag is automatically appended)
	const arrayBuffer = await file.arrayBuffer()
	const encryptedData = await subtle.encrypt(
		{name: 'AES-GCM', iv},
		cryptoKey,
		arrayBuffer
	)

	const encryptedBlob = new Blob([encryptedData], {type: file.type})

	return {
		encryptedFile: new File([encryptedBlob], file.name, {type: file.type}),
		iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''), // Convert to hex string (24 chars for 12 bytes)
		dek
	}
}

export const decryptFile = async (encryptedBlob: Blob, dek: Uint8Array, iv: string) => {
	const subtle = window.crypto.subtle

	// Convert hex IV back to Uint8Array
	const ivArray = new Uint8Array(iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

	// Detect algorithm based on IV length:
	// - 12 bytes (24 hex chars) = AES-GCM (new)
	// - 16 bytes (32 hex chars) = AES-CBC (legacy)
	const isGCM = ivArray.length === 12
	const algorithm = isGCM ? 'AES-GCM' : 'AES-CBC'

	// Import the key with detected algorithm
	const cryptoKey = await subtle.importKey(
		'raw',
		dek,
		{name: algorithm, length: 256},
		false,
		['decrypt']
	)

	// Decrypt the data
	const encryptedData = await encryptedBlob.arrayBuffer()
	const decryptedData = await subtle.decrypt(
		{name: algorithm, iv: ivArray},
		cryptoKey,
		encryptedData
	)

	return decryptedData
}

export const downloadAndDecryptFile = async (fileUrl: string, dek: Uint8Array, iv: string, mimeType: string) => {
	// Download the encrypted file
	const response = await fetch(fileUrl)
	const encryptedBlob = await response.blob()

	// Decrypt the file
	const decryptedData = await decryptFile(encryptedBlob, dek, iv)

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

export const getPreSignedUploadUrl = async (type: string) => {
	const response = await api.post<{uploadUrl: string, fileKey: string}>('/api/photos/upload-url', {
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
	payload: {
		encryptionVersion: 1
		contentIv: string
		wrappedDek: string
		wrappedDekIv: string
		encryptedFilename: string
		filenameIv: string
	},
	mimeType: string,
	imageWidth?: number,
	imageHeight?: number
) => {
	return await api.post('/api/photos', {
		fileKey,
		encryptionVersion: payload.encryptionVersion,
		contentIv: payload.contentIv,
		wrappedDek: payload.wrappedDek,
		wrappedDekIv: payload.wrappedDekIv,
		encryptedFilename: payload.encryptedFilename,
		filenameIv: payload.filenameIv,
		mimeType,
		imageWidth,
		imageHeight
	}) as Photo
}
