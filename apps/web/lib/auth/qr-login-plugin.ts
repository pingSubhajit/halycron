import type {BetterAuthPlugin} from 'better-auth'
import {createAuthEndpoint} from 'better-auth/api'
import {setSessionCookie} from 'better-auth/cookies'
import {APIError} from 'better-call'
import {verifyExchangeToken} from '@/app/api/auth/qr-login/utils'

/**
 * QR Login Plugin for better-auth
 * Enables session creation via QR code scanning from mobile app
 * Based on: https://github.com/better-auth/better-auth/discussions/2125
 */
export function qrLoginPlugin() {
	return {
		id: 'qr-login',
		endpoints: {
			qrLoginExchange: createAuthEndpoint(
				'/qr-login/plugin-exchange',
				{
					method: 'POST',
				},
				async (c) => {
					const {context, body} = c

					if (!body) {
						throw new APIError('BAD_REQUEST', {
							message: 'Request body is required',
						})
					}

					const {exchangeToken} = body as {exchangeToken: string}

					if (!exchangeToken) {
						throw new APIError('BAD_REQUEST', {
							message: 'exchangeToken is required',
						})
					}

					// Verify the exchange token
					const tokenData = verifyExchangeToken(exchangeToken)

					if (!tokenData) {
						throw new APIError('UNAUTHORIZED', {
							message: 'Invalid or expired exchange token',
						})
					}

					const userId = tokenData.userId
					context.logger?.info?.('QR Login exchange attempt', {userId})

					// Verify the user exists using the internal adapter
					const user = await context.internalAdapter.findUserById(userId)

					if (!user) {
						throw new APIError('NOT_FOUND', {
							message: 'User not found',
						})
					}

					// Get request metadata
					const request = c.request
					const headers = request?.headers
					const ipAddress = headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() 
						|| headers?.get?.('x-real-ip') 
						|| ''
					const userAgent = headers?.get?.('user-agent') || ''

					// Create session using the adapter directly
					// The adapter.create method is the low-level way to insert records
					const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
					
					// Generate a secure session token
					const sessionToken = generateSecureToken(32)
					
					const session = await context.adapter.create({
						model: 'session',
						data: {
							userId,
							token: sessionToken,
							expiresAt,
							ipAddress,
							userAgent,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					})

					if (!session) {
						throw new APIError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create session',
						})
					}

					context.logger?.info?.('QR Login session created', {
						sessionId: session.id,
						userId: session.userId,
					})

					// Set the session cookie using better-auth's built-in method
					await setSessionCookie(c, {
						session,
						user,
					})

					return c.json({
						success: true,
						user: {
							id: user.id,
							email: user.email,
							name: user.name,
						},
						redirect: false,
					})
				}
			),
		},
	} satisfies BetterAuthPlugin
}

/**
 * Generate a secure random token matching better-auth's format
 */
function generateSecureToken(length: number): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	const array = new Uint8Array(length)
	crypto.getRandomValues(array)
	return Array.from(array, byte => chars[byte % chars.length]).join('')
}

