import {NextRequest, NextResponse} from 'next/server'

export const GET = async (request: NextRequest) => {
	const headers: Record<string, string> = {}
	request.headers.forEach((value, key) => {
		headers[key] = value
	})

	return NextResponse.json({
		headers,
		userAgent: request.headers.get('user-agent'),
		customHeaders: {
			'x-halycron-app': request.headers.get('x-halycron-app'),
			'x-app-version': request.headers.get('x-app-version'),
			'x-app-platform': request.headers.get('x-app-platform')
		}
	})
}
