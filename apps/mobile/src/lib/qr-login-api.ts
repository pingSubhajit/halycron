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

