import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {authClient} from './auth-client'

export const useLogout = () => {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	const logout = async () => {
		try {
			setIsLoading(true)
			const {error} = await authClient.signOut()

			if (error) {
				throw error
			}

			toast.success('See you soon! You\'ve been signed out safely')
			router.push('/login')
			router.refresh()
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
