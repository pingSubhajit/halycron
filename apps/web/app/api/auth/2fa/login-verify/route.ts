import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

export async function POST(req: Request) {
  try {
    const { code, userId } = await req.json()

    if (!code || !userId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const isValid = await auth.twoFactor.verify({
      userId,
      code
    })

    if (!isValid) {
      return new NextResponse('Invalid verification code', { status: 400 })
    }

    // Create a new session after successful 2FA verification
    await auth.session.create(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('2FA Login Verification Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 