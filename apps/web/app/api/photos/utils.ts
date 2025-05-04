import {api} from '@/lib/data/api-client'
import {Photo} from '@/app/api/photos/types'

// Function to get the user's encryption key or generate a new one if it doesn't exist
export const getUserKey = async (password: string) => {
	try {
		// Try to get the user's encryption key from the server
		const response = await api.get<{
			encryptedUserKey: string,
			userKeyIv: string,
			userKeySalt: string
		}>('/api/user/encryption-key')

		// If the user has an encryption key, decrypt it
		if (response.encryptedUserKey && response.userKeyIv && response.userKeySalt) {
			return await decryptUserKey(
				response.encryptedUserKey,
				response.userKeyIv,
				response.userKeySalt,
				password
			)
		}

		// If the user doesn't have an encryption key, generate a new one
		const userKey = generateEncryptionKey()
		const {encryptedUserKey, userKeyIv, salt} = await encryptUserKey(userKey, password)

		// Save the encrypted user key to the server
		await api.post('/api/user/encryption-key', {
			encryptedUserKey,
			userKeyIv,
			userKeySalt: salt
		})

		return userKey
	} catch (error) {
		console.error('Error getting user key:', error)
		throw new Error('Failed to get user encryption key')
	}
}

// Generate a random encryption key (used for both user keys and file keys)
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

export const downloadAndDecryptFile = async (
	fileUrl: string,
	encryptedFileKey: string,
	fileKeyIv: string,
	fileIv: string,
	mimeType: string,
	userKey: string
) => {
	// Download the encrypted file
	const response = await fetch(fileUrl)
	const encryptedBlob = await response.blob()

	// First decrypt the file key using the user key
	const fileKey = await decryptFileKey(encryptedFileKey, fileKeyIv, userKey)

	// Then decrypt the file using the decrypted file key
	const decryptedData = await decryptFile(encryptedBlob, fileKey, fileIv)

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

// Derive an encryption key from a password
export const deriveKeyFromPassword = async (password: string, salt: Uint8Array) => {
	const encoder = new TextEncoder()
	const passwordData = encoder.encode(password)

	// Import the password as a key
	const passwordKey = await window.crypto.subtle.importKey(
		'raw',
		passwordData,
		{name: 'PBKDF2'},
		false,
		['deriveKey']
	)

	// Derive a key using PBKDF2
	return await window.crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		passwordKey,
		{name: 'AES-CBC', length: 256},
		false,
		['encrypt', 'decrypt']
	)
}

// Encrypt the user key with the user's password
export const encryptUserKey = async (userKey: string, password: string) => {
	const iv = window.crypto.getRandomValues(new Uint8Array(16))
	const salt = window.crypto.getRandomValues(new Uint8Array(16))

	// Derive a key from the password
	const derivedKey = await deriveKeyFromPassword(password, salt)

	// Convert base64 user key back to bytes
	const keyBytes = Uint8Array.from(atob(userKey), c => c.charCodeAt(0))

	// Encrypt the user key
	const encryptedData = await window.crypto.subtle.encrypt(
		{name: 'AES-CBC', iv},
		derivedKey,
		keyBytes
	)

	return {
		encryptedUserKey: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
		userKeyIv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
		salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
	}
}

// Decrypt the user key with the user's password
export const decryptUserKey = async (encryptedUserKey: string, userKeyIv: string, salt: string, password: string) => {
	// Convert hex IV and salt back to Uint8Array
	const ivArray = new Uint8Array(userKeyIv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
	const saltArray = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

	// Derive a key from the password
	const derivedKey = await deriveKeyFromPassword(password, saltArray)

	// Convert base64 encrypted user key back to bytes
	const encryptedKeyBytes = Uint8Array.from(atob(encryptedUserKey), c => c.charCodeAt(0))

	// Decrypt the user key
	const decryptedData = await window.crypto.subtle.decrypt(
		{name: 'AES-CBC', iv: ivArray},
		derivedKey,
		encryptedKeyBytes
	)

	// Convert the decrypted data back to base64
	return btoa(String.fromCharCode(...new Uint8Array(decryptedData)))
}

// Encrypt a file key with the user key
export const encryptFileKey = async (fileKey: string, userKey: string) => {
	const iv = window.crypto.getRandomValues(new Uint8Array(16))

	// Convert base64 keys back to bytes
	const fileKeyBytes = Uint8Array.from(atob(fileKey), c => c.charCodeAt(0))
	const userKeyBytes = Uint8Array.from(atob(userKey), c => c.charCodeAt(0))

	// Import the user key
	const cryptoKey = await window.crypto.subtle.importKey(
		'raw',
		userKeyBytes,
		{name: 'AES-CBC', length: 256},
		false,
		['encrypt']
	)

	// Encrypt the file key
	const encryptedData = await window.crypto.subtle.encrypt(
		{name: 'AES-CBC', iv},
		cryptoKey,
		fileKeyBytes
	)

	return {
		encryptedFileKey: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
		fileKeyIv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
	}
}

// Decrypt a file key with the user key
export const decryptFileKey = async (encryptedFileKey: string, fileKeyIv: string, userKey: string) => {
	// Convert hex IV back to Uint8Array
	const ivArray = new Uint8Array(fileKeyIv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

	// Convert base64 keys back to bytes
	const encryptedFileKeyBytes = Uint8Array.from(atob(encryptedFileKey), c => c.charCodeAt(0))
	const userKeyBytes = Uint8Array.from(atob(userKey), c => c.charCodeAt(0))

	// Import the user key
	const cryptoKey = await window.crypto.subtle.importKey(
		'raw',
		userKeyBytes,
		{name: 'AES-CBC', length: 256},
		false,
		['decrypt']
	)

	// Decrypt the file key
	const decryptedData = await window.crypto.subtle.decrypt(
		{name: 'AES-CBC', iv: ivArray},
		cryptoKey,
		encryptedFileKeyBytes
	)

	// Convert the decrypted data back to base64
	return btoa(String.fromCharCode(...new Uint8Array(decryptedData)))
}

export const savePhotoToDB = async (
	fileKey: string,
	key: string,
	fileIv: string,
	name: string,
	mimeType: string,
	userKey: string,
	imageWidth?: number,
	imageHeight?: number
) => {
	// Encrypt the file key with the user key
	const {encryptedFileKey, fileKeyIv} = await encryptFileKey(key, userKey)

	return await api.post('/api/photos', {
		fileKey,
		encryptedFileKey,
		fileKeyIv,
		fileIv,
		originalFilename: name,
		mimeType,
		imageWidth,
		imageHeight
	}) as Photo
}
