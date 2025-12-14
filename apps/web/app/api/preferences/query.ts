import {UseQueryOptions, useQuery} from '@tanstack/react-query'
import {api} from '@/lib/data/api-client'
import {userPreferencesQueryKeys} from '@/app/api/preferences/keys'
import {UserPreferencesResponse} from '@/app/api/preferences/types'

export const useUserPreferences = (
	options?: Omit<UseQueryOptions<UserPreferencesResponse, Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery({
		queryKey: userPreferencesQueryKeys.preferences(),
		queryFn: async () => {
			return api.get<UserPreferencesResponse>('/api/preferences')
		},
		...options
	})
}


