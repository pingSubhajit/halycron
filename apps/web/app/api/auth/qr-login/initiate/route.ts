import {NextRequest, NextResponse} from 'next/server'
import {createQrLoginRequest, QrLoginInitiateResponse} from '../utils'

// Get client IP address
const getIpAddress = (request: NextRequest): string | null => {
	if (process.env.VERCEL_ENV) {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const {ipAddress} = require('@vercel/functions')
		return ipAddress(request) || null
	}
	return request.headers.get('x-forwarded-for')?.split(',')[0]
		|| request.headers.get('x-real-ip')
		|| null
}

export async function POST(request: NextRequest) {
	try {
		const ipAddress = getIpAddress(request)
		const userAgent = request.headers.get('user-agent')

		// Create new QR login request
		const qrRequest = await createQrLoginRequest(ipAddress, userAgent)

		// Build the QR code data URL (deep link format)
		const qrData = `halycron://qr-login/${qrRequest.token}`

		const response: QrLoginInitiateResponse = {
			token: qrRequest.token,
			expiresAt: qrRequest.expiresAt.toISOString(),
			qrData
		}

		return NextResponse.json(response)
	} catch (error) {
		console.error('Error initiating QR login:', error)
		return NextResponse.json(
			{error: 'Failed to initiate QR login'},
			{status: 500}
		)
	}
}

