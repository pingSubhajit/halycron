import {NextRequest, NextResponse} from 'next/server'
import {getQrLoginRequest, updateQrLoginRequestStatus} from '../../utils'

export async function POST(
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

		// Only cancel if still pending
		if (qrRequest.status === 'pending') {
			await updateQrLoginRequestStatus(token, 'cancelled')
		}

		// Idempotent - always return success
		return NextResponse.json({
			success: true,
			message: 'QR login request cancelled'
		})
	} catch (error) {
		console.error('Error cancelling QR login:', error)
		return NextResponse.json(
			{error: 'Failed to cancel QR login'},
			{status: 500}
		)
	}
}

