import { NextResponse } from 'next/server'
import { authClient } from "@/lib/auth/auth-client"
import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { password } = await request.json()
    
    if (!password) {
      return new NextResponse('Password is required', { status: 400 })
    }

    const data = await auth.api.enableTwoFactor({body: { password }})

    return NextResponse.json({
      totpURI: data.totpURI,
      backupCodes: data.backupCodes
    })
  } catch (error) {
    console.error('2FA Setup Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 