import {NextRequest, NextResponse} from 'next/server'

const isMobileUserAgent = (ua: string) => /Android|iPhone|iPad|iPod/i.test(ua)

export const GET = async (req: NextRequest) => {
	const token = req.nextUrl.searchParams.get('token')
	const error = req.nextUrl.searchParams.get('error')

	// If not on a mobile device, keep the user on the web reset page.
	const ua = req.headers.get('user-agent') || ''
	if (!isMobileUserAgent(ua)) {
		const webUrl = new URL('/reset-password', req.nextUrl.origin)
		if (token) webUrl.searchParams.set('token', token)
		if (error) webUrl.searchParams.set('error', error)
		return NextResponse.redirect(webUrl, 302)
	}

	// Mobile: redirect into the app deep link (our Android/iOS intent filters expect /reset-password).
	const deepLink = new URL('halycron:///reset-password')
	if (token) deepLink.searchParams.set('token', token)
	if (error) deepLink.searchParams.set('error', error)

	return NextResponse.redirect(deepLink.toString(), 302)
}


