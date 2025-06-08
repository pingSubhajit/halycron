import {QueryOptions, useQuery} from '@tanstack/react-query'
import {privacySettingsQueryKeys} from '@/app/api/privacy-settings/keys'
import {api} from '@/lib/data/api-client'
import {PrivacySettingsResponse} from '@/app/api/privacy-settings/types'

export const usePrivacySettings = (options?: QueryOptions<PrivacySettingsResponse, Error>) => {
	return useQuery({
		queryKey: privacySettingsQueryKeys.settings(),
		queryFn: async () => {
			return api.get<PrivacySettingsResponse>('/api/privacy-settings')
		},
		...options
	})
}
