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

		// If approved, return the exchange token for the web app
		if (qrRequest.status === 'approved') {
			const exchangeToken = getOneTimeToken(token)
			
			if (!exchangeToken) {
				// Token was already retrieved - return approved status only
				const responseData: QrLoginStatusResponse = {
					status: 'approved'
				}
				return NextResponse.json(responseData)
			}

			const responseData: QrLoginStatusResponse = {
				status: 'approved',
				oneTimeToken: exchangeToken
			}
			
			// Clear from mapping after sending (exchange token store handles its own cleanup)
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
