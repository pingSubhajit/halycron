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

			toast.success('Logged out successfully')
			router.push('/login')
			router.refresh()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
		} finally {
			setIsLoading(false)
		}
	}

	return {
		logout,
		isLoading
	}
}
