import CryptoJS from 'crypto-js'

export const encryptFile = async (file: File, encryptionKey: string) => {
	const arrayBuffer = await file.arrayBuffer()
	const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
	const iv = CryptoJS.lib.WordArray.random(16)
	const key = CryptoJS.enc.Utf8.parse(encryptionKey) // Ensure correct key format

	const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
		iv: iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.NoPadding
	})

	// Store encrypted data as Hex string
	const encryptedBlob = new Blob([CryptoJS.enc.Hex.stringify(encrypted.ciphertext)], {
		type: file.type
	})

	return {
		encryptedFile: new File([encryptedBlob], file.name, {type: file.type}),
		iv: iv.toString(CryptoJS.enc.Hex), // Store IV as hex string
		key: encryptionKey
	}
}

export const wordArrayToArrayBuffer = (wordArray: CryptoJS.lib.WordArray): ArrayBuffer => {
	const {words, sigBytes} = wordArray
	const uint8View = new Uint8Array(sigBytes)

	for (let i = 0; i < sigBytes; i++) {
		uint8View[i] = (words[i >>> 2]! >>> ((3 - (i % 4)) * 8)) & 0xff
	}

	return uint8View.buffer
}

export const decryptFile = async (encryptedBlob: Blob, key: string, iv: string) => {
	const encryptedText = await encryptedBlob.text() // Read as text (Hex string)
	const keyWordArray = CryptoJS.enc.Utf8.parse(key) // Ensure correct key format

	const cipherParams = CryptoJS.lib.CipherParams.create({
		ciphertext: CryptoJS.enc.Hex.parse(encryptedText) // Convert hex back to WordArray
	})

	const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
		iv: CryptoJS.enc.Hex.parse(iv),
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.NoPadding
	})

	return wordArrayToArrayBuffer(decrypted)
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
