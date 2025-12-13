import {NextRequest, NextResponse} from 'next/server'
import {getSessionFromHeaders, checkMobileLoginTokenStatus} from '../../utils'

export const GET = async (
	_request: NextRequest,
	{params}: {params: Promise<{token: string}>}
) => {
	try {
		// Verify the web session is authenticated (only the user who created the token can check it)
		const sessionResult = await getSessionFromHeaders()

		if (!sessionResult?.user?.id) {
			return NextResponse.json(
				{error: 'Unauthorized'},
				{status: 401}
			)
		}

		const {token} = await params
		const status = checkMobileLoginTokenStatus(token)

		return NextResponse.json({
			status,
			// If used, mobile has successfully logged in
			completed: status === 'used'
		})
	} catch (error) {
		console.error('Error checking mobile login status:', error)
		return NextResponse.json(
			{error: 'Failed to check status'},
			{status: 500}
		)
	}
}

