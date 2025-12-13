import {authClient} from './auth-client'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
	// Get the auth cookie from better-auth
	const cookies = authClient.getCookie()

	// Merge headers with auth cookie
	const headers = {
		...options.headers,
		'Content-Type': 'application/json',
		...(cookies ? {'Cookie': cookies} : {})
	}

	// Make the authenticated request
	// credentials: 'omit' prevents interference with manually set Cookie header
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers,
		credentials: 'omit'
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
