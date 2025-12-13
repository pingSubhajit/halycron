import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'

export const useLogout = () => {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	const logout = async () => {
		try {
			setIsLoading(true)
			// Use a server-side logout endpoint to reliably clear httpOnly cookies.
			const res = await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include'
			})
			if (!res.ok) {
				throw new Error('Failed to sign out')
			}

			toast.success('See you soon! You\'ve been signed out safely')
			// Force a hard navigation so middleware re-evaluates auth state.
			window.location.href = '/login'
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Hmm, we had trouble signing you out. Mind trying again?')
		} finally {
			setIsLoading(false)
		}
	}

	return {
		logout,
		isLoading
	}
}
