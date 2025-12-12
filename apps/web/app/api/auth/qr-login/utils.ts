import {db} from '@/db/drizzle'
import {qrLoginRequest} from '@/db/schema'
import {eq, and, lt} from 'drizzle-orm'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'

// QR login token expiry time in milliseconds (3 minutes)
export const QR_LOGIN_EXPIRY_MS = 3 * 60 * 1000

// Generate a secure random token
export const generateQrToken = (): string => {
	return crypto.randomUUID()
}

// Get the expiry timestamp
export const getExpiryTimestamp = (): Date => {
	return new Date(Date.now() + QR_LOGIN_EXPIRY_MS)
}

// Status types for QR login requests
export type QrLoginStatus = 'pending' | 'approved' | 'expired' | 'cancelled'

// Response types
export interface QrLoginInitiateResponse {
	token: string
	expiresAt: string
	qrData: string
}

export interface QrLoginStatusResponse {
	status: QrLoginStatus
	remainingMs?: number
	oneTimeToken?: string
	ipAddress?: string | null
	userAgent?: string | null
}

// Create a new QR login request
export const createQrLoginRequest = async (ipAddress: string | null, userAgent: string | null) => {
	const token = generateQrToken()
	const expiresAt = getExpiryTimestamp()

	const [request] = await db.insert(qrLoginRequest).values({
		token,
		status: 'pending',
		ipAddress,
		userAgent,
		expiresAt
	}).returning()

	return request
}

// Get QR login request by token
export const getQrLoginRequest = async (token: string) => {
	const [request] = await db
		.select()
		.from(qrLoginRequest)
		.where(eq(qrLoginRequest.token, token))
		.limit(1)

	return request
}

// Update QR login request status
export const updateQrLoginRequestStatus = async (
	token: string,
	status: QrLoginStatus,
	additionalData?: {
		userId?: string
		webSessionId?: string
		approvedBySessionId?: string
		oneTimeToken?: string
	}
) => {
	const [updated] = await db
		.update(qrLoginRequest)
		.set({
			status,
			...(additionalData?.userId && {userId: additionalData.userId}),
			...(additionalData?.webSessionId && {webSessionId: additionalData.webSessionId}),
			...(additionalData?.approvedBySessionId && {approvedBySessionId: additionalData.approvedBySessionId}),
			updatedAt: new Date()
		})
		.where(eq(qrLoginRequest.token, token))
		.returning()

	// Store one-time token separately (in memory for now, since it's short-lived)
	if (additionalData?.oneTimeToken) {
		oneTimeTokenStore.set(token, additionalData.oneTimeToken)
	}

	return updated
}

// Use globalThis to persist stores across hot module reloads in development
const globalForQrLogin = globalThis as unknown as {
	oneTimeTokenStore: Map<string, string>
	exchangeTokenStore: Map<string, ExchangeTokenData>
}

// Temporary in-memory store for one-time tokens (short-lived)
const oneTimeTokenStore = globalForQrLogin.oneTimeTokenStore ?? new Map<string, string>()
if (!globalForQrLogin.oneTimeTokenStore) {
	globalForQrLogin.oneTimeTokenStore = oneTimeTokenStore
}

// Get one-time token for a QR login request
export const getOneTimeToken = (qrToken: string): string | undefined => {
	return oneTimeTokenStore.get(qrToken)
}

// Clear one-time token after use
export const clearOneTimeToken = (qrToken: string): void => {
	oneTimeTokenStore.delete(qrToken)
}

// Exchange token data structure
interface ExchangeTokenData {
	userId: string
	qrToken: string
	expiresAt: number
}

// Secure exchange token store (maps exchangeToken -> user data)
// Uses globalThis to persist across hot module reloads
const exchangeTokenStore = globalForQrLogin.exchangeTokenStore ?? new Map<string, ExchangeTokenData>()
if (!globalForQrLogin.exchangeTokenStore) {
	globalForQrLogin.exchangeTokenStore = exchangeTokenStore
}

// Generate a secure exchange token
export const generateSecureExchangeToken = (): string => {
	// Use a combination of UUID and random bytes for extra security
	const uuid = crypto.randomUUID()
	const randomPart = crypto.randomUUID().replace(/-/g, '')
	return `${uuid}-${randomPart}`
}

// Store exchange token with user data
export const storeExchangeToken = (token: string, data: ExchangeTokenData): void => {
	console.log('[ExchangeToken] Storing token:', token.substring(0, 20) + '...')
	console.log('[ExchangeToken] Data:', { userId: data.userId, qrToken: data.qrToken.substring(0, 10) + '...' })
	console.log('[ExchangeToken] Store size before:', exchangeTokenStore.size)
	
	exchangeTokenStore.set(token, data)
	
	console.log('[ExchangeToken] Store size after:', exchangeTokenStore.size)
	
	// Auto-cleanup after expiry
	const ttl = data.expiresAt - Date.now()
	if (ttl > 0) {
		setTimeout(() => {
			console.log('[ExchangeToken] Auto-cleanup for token:', token.substring(0, 20) + '...')
			exchangeTokenStore.delete(token)
		}, ttl)
	}
}

// Verify and consume exchange token
export const verifyExchangeToken = (token: string): ExchangeTokenData | null => {
	console.log('[ExchangeToken] Verifying token:', token.substring(0, 20) + '...')
	console.log('[ExchangeToken] Store size:', exchangeTokenStore.size)
	console.log('[ExchangeToken] Store keys:', Array.from(exchangeTokenStore.keys()).map(k => k.substring(0, 20) + '...'))
	
	const data = exchangeTokenStore.get(token)
	
	if (!data) {
		console.log('[ExchangeToken] Token NOT found in store')
		return null
	}
	
	console.log('[ExchangeToken] Token found! User:', data.userId)
	
	// Check if expired
	if (Date.now() > data.expiresAt) {
		console.log('[ExchangeToken] Token expired')
		exchangeTokenStore.delete(token)
		return null
	}
	
	// Consume the token (one-time use)
	exchangeTokenStore.delete(token)
	
	return data
}

// Check if token is expired
export const isTokenExpired = (expiresAt: Date): boolean => {
	return new Date() > expiresAt
}

// Get remaining time in milliseconds
export const getRemainingTimeMs = (expiresAt: Date): number => {
	return Math.max(0, expiresAt.getTime() - Date.now())
}

// Get session from request headers
export const getSessionFromHeaders = async () => {
	const headersList = await headers()
	const sessionResult = await auth.api.getSession({
		headers: headersList
	})
	return sessionResult
}

// Clean up expired QR login requests (utility for cron job)
export const cleanupExpiredRequests = async () => {
	const now = new Date()
	
	// Update status of expired pending requests
	await db
		.update(qrLoginRequest)
		.set({status: 'expired', updatedAt: now})
		.where(
			and(
				eq(qrLoginRequest.status, 'pending'),
				lt(qrLoginRequest.expiresAt, now)
			)
		)

	// Delete requests older than 24 hours
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
	await db
		.delete(qrLoginRequest)
		.where(lt(qrLoginRequest.createdAt, oneDayAgo))
}

