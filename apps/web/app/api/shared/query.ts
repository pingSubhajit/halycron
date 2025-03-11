import {useQuery} from '@tanstack/react-query'
import {sharedQueryKeys} from './keys'
import {GetSharedItemsResponse} from './types'

// Hook to get shared items by token
export function useSharedItems(token: string, isPinVerified: boolean = false) {
	return useQuery({
		queryKey: sharedQueryKeys.detail(token),
		queryFn: async (): Promise<GetSharedItemsResponse> => {
			const response = await fetch(`/api/shared/${token}`)
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to fetch shared items')
			}
			return response.json()
		},
		enabled: Boolean(token) && (isPinVerified || true), // Enable if token exists and pin is verified (or no pin required)
		staleTime: 1000 * 60 * 5 // 5 minutes
	})
}
