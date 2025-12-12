/**
 * Polyfills required for react-native-quick-crypto
 * This file must be imported at the very beginning of the app (in index.js)
 */

// Install crypto getRandomValues polyfill first
import 'react-native-get-random-values'

// Set up base64 encoding/decoding globals that react-native-quick-crypto's Buffer needs
if (typeof global.btoa === 'undefined') {
	global.btoa = (str: string) => {
		return Buffer.from(str, 'binary').toString('base64')
	}
}

if (typeof global.atob === 'undefined') {
	global.atob = (b64: string) => {
		return Buffer.from(b64, 'base64').toString('binary')
	}
}

// Set up base64FromArrayBuffer for Buffer polyfill
if (typeof global.base64FromArrayBuffer === 'undefined') {
	global.base64FromArrayBuffer = (arrayBuffer: ArrayBuffer): string => {
		const bytes = new Uint8Array(arrayBuffer)
		let binary = ''
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i])
		}
		// Use a simple base64 encoding
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
		let result = ''
		let i = 0
		while (i < binary.length) {
			const a = binary.charCodeAt(i++)
			const b = i < binary.length ? binary.charCodeAt(i++) : 0
			const c = i < binary.length ? binary.charCodeAt(i++) : 0

			const triplet = (a << 16) | (b << 8) | c

			result += chars[(triplet >> 18) & 0x3f]
			result += chars[(triplet >> 12) & 0x3f]
			result += i > binary.length + 1 ? '=' : chars[(triplet >> 6) & 0x3f]
			result += i > binary.length ? '=' : chars[triplet & 0x3f]
		}
		return result
	}
}

// Extend global type
declare global {
	// eslint-disable-next-line no-var
	var base64FromArrayBuffer: ((arrayBuffer: ArrayBuffer) => string) | undefined
	// eslint-disable-next-line no-var
	var btoa: ((str: string) => string) | undefined
	// eslint-disable-next-line no-var
	var atob: ((b64: string) => string) | undefined
}

export {}

