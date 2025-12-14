import {QueryOptions, useQuery} from '@tanstack/react-query'
import {api} from '@/lib/data/api-client'
import {userPreferencesQueryKeys} from '@/app/api/preferences/keys'
import {UserPreferencesResponse} from '@/app/api/preferences/types'

export const useUserPreferences = (options?: QueryOptions<UserPreferencesResponse, Error>) => {
	return useQuery({
		queryKey: userPreferencesQueryKeys.preferences(),
		queryFn: async () => {
			return api.get<UserPreferencesResponse>('/api/preferences')
		},
		...options
	})
}


