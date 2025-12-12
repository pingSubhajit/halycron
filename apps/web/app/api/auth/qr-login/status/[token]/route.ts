import {NextRequest, NextResponse} from 'next/server'
import {
	getQrLoginRequest,
	isTokenExpired,
	getRemainingTimeMs,
	updateQrLoginRequestStatus,
	getOneTimeToken,
	clearOneTimeToken,
	QrLoginStatusResponse
} from '../../utils'

export async function GET(
	request: NextRequest,
	{params}: {params: Promise<{token: string}>}
) {
	try {
		const {token} = await params

		if (!token) {
			return NextResponse.json(
				{error: 'Token is required'},
				{status: 400}
			)
		}

		const qrRequest = await getQrLoginRequest(token)

		if (!qrRequest) {
			return NextResponse.json(
				{error: 'QR login request not found'},
				{status: 404}
			)
		}

		// Check if expired and update status if needed
		if (qrRequest.status === 'pending' && isTokenExpired(qrRequest.expiresAt)) {
			await updateQrLoginRequestStatus(token, 'expired')
			
			const response: QrLoginStatusResponse = {
				status: 'expired'
			}
			return NextResponse.json(response)
		}

		// If approved, return the one-time token for the web app to verify
		if (qrRequest.status === 'approved') {
			const oneTimeToken = getOneTimeToken(token)
			
			console.log('[Status] Approved! QR token:', token.substring(0, 10) + '...')
			console.log('[Status] Exchange token from store:', oneTimeToken ? oneTimeToken.substring(0, 20) + '...' : 'NOT FOUND')
			
			if (!oneTimeToken) {
				// Token was already retrieved - the client should have it
				// Return approved status without token (client should already be verifying)
				console.log('[Status] Exchange token already retrieved, returning status only')
				const responseData: QrLoginStatusResponse = {
					status: 'approved'
				}
				return NextResponse.json(responseData)
			}

			const responseData: QrLoginStatusResponse = {
				status: 'approved',
				oneTimeToken // Return the one-time token for the web to verify
			}
			
			console.log('[Status] Returning exchange token to client, then clearing from oneTimeTokenStore')
			
			// Clear from oneTimeTokenStore after sending (but NOT from exchangeTokenStore - that's for the exchange endpoint)
			clearOneTimeToken(token)
			
			return NextResponse.json(responseData)
		}

		// Return current status with remaining time and device info
		const response: QrLoginStatusResponse = {
			status: qrRequest.status as QrLoginStatusResponse['status'],
			remainingMs: qrRequest.status === 'pending' 
				? getRemainingTimeMs(qrRequest.expiresAt) 
				: undefined,
			ipAddress: qrRequest.ipAddress,
			userAgent: qrRequest.userAgent
		}

		return NextResponse.json(response)
	} catch (error) {
		console.error('Error checking QR login status:', error)
		return NextResponse.json(
			{error: 'Failed to check QR login status'},
			{status: 500}
		)
	}
}

