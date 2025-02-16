import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { headers } from "next/headers"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
  })
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

    const { code, secret } = await req.json()

    if (!code || !secret) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const isValid = await auth.api.verifyTOTP({
      body: {
        code
      }
    })

    if (!isValid) {
      return new NextResponse('Invalid verification code', { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('2FA Verification Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 