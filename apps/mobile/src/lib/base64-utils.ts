/**
 * Reliable base64 encoding/decoding utilities for React Native
 * These don't rely on Buffer's base64 implementation which can be buggy
 */

// Base64 character set
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Encode Uint8Array to base64 string
 */
export const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
	let result = ''
	const len = bytes.length
	const remainder = len % 3

	// Process 3 bytes at a time
	for (let i = 0; i < len - remainder; i += 3) {
		const triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
		result += BASE64_CHARS[(triplet >> 18) & 0x3f]
		result += BASE64_CHARS[(triplet >> 12) & 0x3f]
		result += BASE64_CHARS[(triplet >> 6) & 0x3f]
		result += BASE64_CHARS[triplet & 0x3f]
	}

	// Handle remaining bytes
	if (remainder === 1) {
		const val = bytes[len - 1]
		result += BASE64_CHARS[(val >> 2) & 0x3f]
		result += BASE64_CHARS[(val << 4) & 0x3f]
		result += '=='
	} else if (remainder === 2) {
		const val = (bytes[len - 2] << 8) | bytes[len - 1]
		result += BASE64_CHARS[(val >> 10) & 0x3f]
		result += BASE64_CHARS[(val >> 4) & 0x3f]
		result += BASE64_CHARS[(val << 2) & 0x3f]
		result += '='
	}

	return result
}

/**
 * Decode base64 string to Uint8Array
 */
export const base64ToUint8Array = (base64: string): Uint8Array => {
	// Remove padding
	const cleanBase64 = base64.replace(/=/g, '')
	const len = cleanBase64.length
	const outputLen = Math.floor((len * 3) / 4)
	const result = new Uint8Array(outputLen)

	let outputIndex = 0
	for (let i = 0; i < len; i += 4) {
		const a = BASE64_CHARS.indexOf(cleanBase64[i])
		const b = i + 1 < len ? BASE64_CHARS.indexOf(cleanBase64[i + 1]) : 0
		const c = i + 2 < len ? BASE64_CHARS.indexOf(cleanBase64[i + 2]) : 0
		const d = i + 3 < len ? BASE64_CHARS.indexOf(cleanBase64[i + 3]) : 0

		const triplet = (a << 18) | (b << 12) | (c << 6) | d

		if (outputIndex < outputLen) result[outputIndex++] = (triplet >> 16) & 0xff
		if (outputIndex < outputLen) result[outputIndex++] = (triplet >> 8) & 0xff
		if (outputIndex < outputLen) result[outputIndex++] = triplet & 0xff
	}

	return result
}

