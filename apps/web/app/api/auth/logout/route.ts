import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'

export const POST = async (req: NextRequest) => {
	try {
		await auth.api.signOut({
			headers: req.headers
		})

		// Redirect so <form method="post"> logout works too
		return NextResponse.redirect(new URL('/login', req.url), 303)
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Failed to logout'},
			{status: 500}
		)
	}
}
