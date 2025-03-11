import {useMutation, useQueryClient} from '@tanstack/react-query'
import {CreateShareLinkRequest, CreateShareLinkResponse, VerifyPinRequest, VerifyPinResponse} from './types'
import {sharedQueryKeys} from './keys'

// Hook to create a new share link
export function useCreateShareLink() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: CreateShareLinkRequest): Promise<CreateShareLinkResponse> => {
			const response = await fetch('/api/shared', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to create share link')
			}

			return response.json()
		}
		// If we ever implement a listing of user's shared links, we could invalidate that query here
	})
}

// Hook to verify a PIN for a shared link
export function useVerifyPin() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: VerifyPinRequest): Promise<VerifyPinResponse> => {
			const response = await fetch('/api/shared/verify-pin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to verify PIN')
			}

			return response.json()
		},
		onSuccess: (data, variables) => {
			if (data.isValid) {
				// If PIN verification succeeds, invalidate the shared items query to trigger a refetch
				queryClient.invalidateQueries({queryKey: sharedQueryKeys.detail(variables.token)})
			}
		}
	})
}
