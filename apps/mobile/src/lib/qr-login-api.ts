import {api} from './api-client'

interface QrLoginStatusResponse {
	status: 'pending' | 'approved' | 'expired' | 'cancelled'
	remainingMs?: number
	sessionToken?: string
	ipAddress?: string | null
	userAgent?: string | null
}

interface QrLoginApproveResponse {
	success: boolean
	message: string
}

/**
 * Get the status of a QR login request
 * Used to show device info before approving
 */
export const getQrLoginStatus = async (token: string): Promise<QrLoginStatusResponse> => {
	return api.get<QrLoginStatusResponse>(`/api/auth/qr-login/status/${token}`)
}

/**
 * Approve a QR login request
 * This will create a session for the web browser
 */
export const approveQrLogin = async (token: string): Promise<QrLoginApproveResponse> => {
	return api.post<QrLoginApproveResponse>('/api/auth/qr-login/approve', {token})
}

/**
 * Parse a QR code URL to extract the token
 * Supports: halycron://qr-login/{token}
 */
export const parseQrLoginUrl = (url: string): string | null => {
	// Check for halycron://qr-login/{token} format
	const qrLoginRegex = /^halycron:\/\/qr-login\/([a-f0-9-]+)$/i
	const match = url.match(qrLoginRegex)
	
	if (match && match[1]) {
		return match[1]
	}
	
	return null
}

/**
 * Validate if a URL is a valid QR login URL
 */
export const isQrLoginUrl = (url: string): boolean => {
	return parseQrLoginUrl(url) !== null
}

// ============================================
// Mobile Login Functions (Web -> Mobile flow)
// ============================================

/**
 * Parse a mobile login QR code URL to extract the token
 * Supports: halycron://mobile-login/{token}
 */
export const parseMobileLoginUrl = (url: string): string | null => {
	// Check for halycron://mobile-login/{token} format
	const mobileLoginRegex = /^halycron:\/\/mobile-login\/([a-f0-9-]+)$/i
	const match = url.match(mobileLoginRegex)
	
	if (match && match[1]) {
		return match[1]
	}
	
	return null
}

/**
 * Validate if a URL is a valid mobile login URL
 */
export const isMobileLoginUrl = (url: string): boolean => {
	return parseMobileLoginUrl(url) !== null
}

interface MobileLoginExchangeResponse {
	success: boolean
	user?: {
		id: string
		email: string
		name: string
	}
	token?: string
	message?: string
}

/**
 * Exchange a mobile login token for a session
 * This is called when the mobile app scans a QR code from the logged-in web app
 */
export const exchangeMobileLoginToken = async (token: string): Promise<MobileLoginExchangeResponse> => {
	const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
	
	const response = await fetch(`${API_URL}/api/auth/qr-login/mobile-exchange`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({token})
	})

	if (!response.ok) {
		const error = await response.json().catch(() => ({message: 'Failed to exchange token'}))
		throw new Error(error.message || 'Failed to exchange token')
	}

	return response.json()
}

