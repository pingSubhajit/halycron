import {useMutation} from '@tanstack/react-query'
import {toast} from 'sonner'

export const useSendVerificationEmail = () => {
	return useMutation({
		mutationFn: async () => {
			const response = await fetch('/api/auth/send-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to send verification email')
			}

			return response.json()
		},
		onSuccess: () => {
			toast.success('Verification email sent! Please check your inbox.')
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to send verification email')
		}
	})
}
