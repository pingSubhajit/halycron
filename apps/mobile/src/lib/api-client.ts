import {authClient} from './auth-client'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

// SecureStore key for better-auth expo-client cookie storage
// Format: {storagePrefix}_cookie
const COOKIE_STORAGE_KEY = 'halycron_cookie'

interface ApiResponse<T> {
	data?: T
	error?: string
}

class ApiClient {
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		// Get the auth cookie from better-auth
		let cookies = authClient.getCookie()
		
		// DEBUG: Log cookie information
		console.log('[DEBUG ApiClient] getCookie() returned:', cookies)
		console.log('[DEBUG ApiClient] getCookie() type:', typeof cookies)
		
		// Fix: expo-client's getCookie() returns cookies with a leading "; " separator
		// which breaks cookie parsing. Remove the leading separator.
		if (cookies && typeof cookies === 'string') {
			cookies = cookies.replace(/^;\s*/, '')
			console.log('[DEBUG ApiClient] Fixed cookie string:', cookies)
		}
		
		// DEBUG: Also read directly from SecureStore to compare
		try {
			const storedCookie = await SecureStore.getItemAsync(COOKIE_STORAGE_KEY)
			console.log('[DEBUG ApiClient] SecureStore raw cookie:', storedCookie)
			if (storedCookie) {
				const parsed = JSON.parse(storedCookie)
				console.log('[DEBUG ApiClient] SecureStore parsed cookie:', JSON.stringify(parsed, null, 2))
			}
		} catch (e) {
			console.log('[DEBUG ApiClient] Error reading SecureStore:', e)
		}

		// Merge headers with auth cookie
		const headers = {
			'Content-Type': 'application/json',
			...options.headers,
			...(cookies ? {'Cookie': cookies} : {})
		}
		
		// DEBUG: Log the full headers being sent
		console.log('[DEBUG ApiClient] Request headers:', JSON.stringify(headers, null, 2))
		console.log('[DEBUG ApiClient] Requesting:', `${API_URL}${endpoint}`)

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
			console.log('[DEBUG ApiClient] Request failed:', {
				status: response.status,
				statusText: response.statusText,
				error,
				endpoint,
				url: `${API_URL}${endpoint}`
			})
			throw new Error(error.message || 'An unknown error occurred')
		}

		return response.json()
	}

	async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'GET'
		})
	}

	async post<T>(endpoint: string, body?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined
		})
	}

	async patch<T>(endpoint: string, body?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: body ? JSON.stringify(body) : undefined
		})
	}

	async delete<T>(endpoint: string, options?: { body?: any }): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'DELETE',
			body: options?.body ? JSON.stringify(options.body) : undefined
		})
	}
}

export const api = new ApiClient()
