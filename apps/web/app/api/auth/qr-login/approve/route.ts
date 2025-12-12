import {NextRequest, NextResponse} from 'next/server'
import {
	getQrLoginRequest,
	isTokenExpired,
	updateQrLoginRequestStatus,
	getSessionFromHeaders,
	generateSecureExchangeToken,
	storeExchangeToken
} from '../utils'

interface ApproveRequest {
	token: string
}

export async function POST(request: NextRequest) {
	try {
		// Verify the mobile session is authenticated
		const sessionResult = await getSessionFromHeaders()

		if (!sessionResult?.user?.id) {
			return NextResponse.json(
				{error: 'Unauthorized - valid session required'},
				{status: 401}
			)
		}

		const body: ApproveRequest = await request.json()
		const {token} = body

		if (!token) {
			return NextResponse.json(
				{error: 'Token is required'},
				{status: 400}
			)
		}

		// Get the QR login request
		const qrRequest = await getQrLoginRequest(token)

		if (!qrRequest) {
			return NextResponse.json(
				{error: 'QR login request not found'},
				{status: 404}
			)
		}

		// Check if already used or expired
		if (qrRequest.status !== 'pending') {
			return NextResponse.json(
				{error: `QR login request is ${qrRequest.status}`},
				{status: 400}
			)
		}

		if (isTokenExpired(qrRequest.expiresAt)) {
			await updateQrLoginRequestStatus(token, 'expired')
			return NextResponse.json(
				{error: 'QR login request has expired'},
				{status: 400}
			)
		}

		// Generate a secure exchange token that we control
		// This token contains the user ID and can be verified by the exchange endpoint
		const exchangeToken = generateSecureExchangeToken()
		
		console.log('[Approve] Generated exchange token:', exchangeToken.substring(0, 20) + '...')
		console.log('[Approve] Full token length:', exchangeToken.length)
		
		// Store the exchange token with the user ID (expires in 5 minutes)
		storeExchangeToken(exchangeToken, {
			userId: sessionResult.user.id,
			qrToken: token,
			expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
		})

		console.log('[Approve] Stored exchange token for user:', sessionResult.user.id)

		// Update the QR login request with approval details
		// This also stores the token in oneTimeTokenStore for the status endpoint
		await updateQrLoginRequestStatus(token, 'approved', {
			userId: sessionResult.user.id,
			oneTimeToken: exchangeToken,
			approvedBySessionId: sessionResult.session?.id
		})
		
		console.log('[Approve] Updated QR request status to approved')

		return NextResponse.json({
			success: true,
			message: 'Login approved successfully'
		})
	} catch (error) {
		console.error('Error approving QR login:', error)
		return NextResponse.json(
			{error: 'Failed to approve QR login'},
			{status: 500}
		)
	}
}

