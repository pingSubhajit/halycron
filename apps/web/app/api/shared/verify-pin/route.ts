import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/db/drizzle'
import {eq} from 'drizzle-orm'
import {sharedLink} from '@/db/schema'
import {createHash} from 'crypto'
import {VerifyPinRequest, VerifyPinResponse} from '../types'

// Helper function to hash PIN
function hashPin(pin: string): string {
	return createHash('sha256').update(pin).digest('hex')
}

// Helper function to validate PIN is 4 digits
function validatePin(pin: string | undefined): boolean {
	if (!pin) return false;
	return /^\d{4}$/.test(pin);
}

// POST /api/shared/verify-pin - Verify PIN for a protected shared link
export async function POST(req: NextRequest) {
	try {
		const body: VerifyPinRequest = await req.json()
		const {token, pin} = body
		
		// Validate PIN format
		if (!validatePin(pin)) {
			return NextResponse.json({error: 'PIN must be exactly 4 digits'}, {status: 400})
		}

		// Find the shared link
		const [link] = await db
			.select()
			.from(sharedLink)
			.where(eq(sharedLink.token, token))

		if (!link) {
			return NextResponse.json({error: 'Invalid share link'}, {status: 404})
		}

		// Check if link is expired
		if (new Date() > link.expiresAt) {
			return NextResponse.json({error: 'Share link has expired'}, {status: 410})
		}

		// If the link doesn't require a PIN
		if (!link.isPinProtected) {
			return NextResponse.json({isValid: true} as VerifyPinResponse)
		}

		// Verify PIN hash
		const hashedPin = hashPin(pin)
		const isValid = hashedPin === link.pinHash

		return NextResponse.json({isValid} as VerifyPinResponse)
	} catch (error) {
		console.error('Error verifying PIN:', error)
		return NextResponse.json({error: 'Failed to verify PIN'}, {status: 500})
	}
} 