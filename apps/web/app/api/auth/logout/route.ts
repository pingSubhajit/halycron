import {NextResponse} from 'next/server'
import {authClient} from '@/lib/auth/auth-client'

export const POST = async () => {
	try {
		const {error} = await authClient.signOut()

		if (error) {
			throw error
		}

		return NextResponse.json({message: 'Logged out successfully'})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Failed to logout'},
			{status: 500}
		)
	}
}
