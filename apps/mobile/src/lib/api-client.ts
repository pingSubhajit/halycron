import {authClient} from './auth-client'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

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

		// Fix: expo-client's getCookie() returns cookies with a leading "; " separator
		// which breaks cookie parsing. Remove the leading separator.
		if (cookies && typeof cookies === 'string') {
			cookies = cookies.replace(/^;\s*/, '')
		}

		// Merge headers with auth cookie
		const headers = {
			'Content-Type': 'application/json',
			...options.headers,
			...(cookies ? {'Cookie': cookies} : {})
		}

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
