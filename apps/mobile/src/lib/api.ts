import {authClient} from './auth-client'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

// SecureStore key for better-auth expo-client cookie storage
const COOKIE_STORAGE_KEY = 'halycron_cookie'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
	// Get the auth cookie from better-auth
	let cookies = authClient.getCookie()
	
	// DEBUG: Log cookie information
	console.log('[DEBUG fetchWithAuth] getCookie() returned:', cookies)
	console.log('[DEBUG fetchWithAuth] getCookie() type:', typeof cookies)
	
	// Fix: expo-client's getCookie() returns cookies with a leading "; " separator
	// which breaks cookie parsing. Remove the leading separator.
	if (cookies && typeof cookies === 'string') {
		cookies = cookies.replace(/^;\s*/, '')
		console.log('[DEBUG fetchWithAuth] Fixed cookie string:', cookies)
	}
	
	// DEBUG: Also read directly from SecureStore to compare
	try {
		const storedCookie = await SecureStore.getItemAsync(COOKIE_STORAGE_KEY)
		console.log('[DEBUG fetchWithAuth] SecureStore raw cookie:', storedCookie)
	} catch (e) {
		console.log('[DEBUG fetchWithAuth] Error reading SecureStore:', e)
	}

	// Merge headers with auth cookie
	const headers = {
		...options.headers,
		'Content-Type': 'application/json',
		...(cookies ? {'Cookie': cookies} : {})
	}
	
	// DEBUG: Log request details
	console.log('[DEBUG fetchWithAuth] Request headers:', JSON.stringify(headers, null, 2))
	console.log('[DEBUG fetchWithAuth] Requesting:', `${API_URL}${endpoint}`)

	// Make the authenticated request
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers
	})

	// Handle common response patterns
	if (!response.ok) {
		const error = await response.json().catch(() => ({
			message: `HTTP error ${response.status}`
		}))
		console.log('[DEBUG fetchWithAuth] Request failed:', {
			status: response.status,
			statusText: response.statusText,
			error,
			endpoint
		})
		throw new Error(error.message || 'An unknown error occurred')
	}

	return response.json()
}
