import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {checkAlbumAccess} from '../../utils'

interface Props {
  params: Promise<{
    id: string
  }>
}

export const POST = async (request: NextRequest, {params}: Props) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session) {
			return NextResponse.json({
				error: 'Unauthorized'
			}, {status: 401})
		}

		const {id} = await params
		const hasAccess = await checkAlbumAccess(id, session.user.id)

		if (!hasAccess) {
			return NextResponse.json({
				error: 'Album not found'
			}, {status: 404})
		}

		// Create a response
		const response = NextResponse.json({
			success: true,
			message: 'Album locked successfully'
		})

		// Clear the verification cookie by setting it to expire in the past
		response.cookies.set({
			name: `album-access-${id}`,
			value: '',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: '/',
			maxAge: 0 // Expire immediately
		})

		return response
	} catch (error) {
		console.error('Error locking album:', error)
		return NextResponse.json({
			error: error instanceof Error ? error.message : 'Internal server error'
		}, {status: 500})
	}
}
