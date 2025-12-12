import {NextRequest, NextResponse} from 'next/server'
import {getSessionFromHeaders, createMobileLoginToken, QR_LOGIN_EXPIRY_MS} from '../utils'

export async function POST(request: NextRequest) {
	try {
		// Verify the web session is authenticated
		const sessionResult = await getSessionFromHeaders()

		if (!sessionResult?.user?.id) {
			return NextResponse.json(
				{error: 'Unauthorized - valid session required'},
				{status: 401}
			)
		}

		// Create a mobile login token for this user
		const token = createMobileLoginToken(sessionResult.user.id)
		const expiresAt = new Date(Date.now() + QR_LOGIN_EXPIRY_MS)

		// Build the QR code data URL (deep link format for mobile login)
		const qrData = `halycron://mobile-login/${token}`

		return NextResponse.json({
			token,
			expiresAt: expiresAt.toISOString(),
			qrData
		})
	} catch (error) {
		console.error('Error initiating mobile login:', error)
		return NextResponse.json(
			{error: 'Failed to initiate mobile login'},
			{status: 500}
		)
	}
}

