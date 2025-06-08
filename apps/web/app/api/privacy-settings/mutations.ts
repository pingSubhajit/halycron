import {MutationOptions, useMutation, useQueryClient} from '@tanstack/react-query'
import {privacySettingsQueryKeys} from '@/app/api/privacy-settings/keys'
import {api} from '@/lib/data/api-client'
import {PrivacySettingsResponse, UpdatePrivacySettingRequest} from '@/app/api/privacy-settings/types'

type UpdatePrivacySettingContext = {
	previousSettings: PrivacySettingsResponse | undefined
}

export const useUpdatePrivacySetting = (
	options?: MutationOptions<void, Error, UpdatePrivacySettingRequest, UpdatePrivacySettingContext>
) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (request: UpdatePrivacySettingRequest): Promise<void> => {
			await api.put('/api/privacy-settings', request)
		},
		onMutate: async (variables): Promise<UpdatePrivacySettingContext> => {
			// Cancel any outgoing re-fetches
			await queryClient.cancelQueries({queryKey: privacySettingsQueryKeys.settings()})

			// Snapshot the previous value
			const previousSettings = queryClient.getQueryData<PrivacySettingsResponse>(
				privacySettingsQueryKeys.settings()
			)

			// Optimistically update the cache
			if (previousSettings) {
				const updatedSettings = {...previousSettings}

				// Map frontend setting IDs to response properties
				switch (variables.settingId) {
				case 'strip-location':
					updatedSettings.stripLocationData = variables.enabled
					break
				case 'anonymize-timestamps':
					updatedSettings.anonymizeTimestamps = variables.enabled
					break
				case 'disable-analytics':
					updatedSettings.disableAnalytics = variables.enabled
					break
				case 'minimal-logs':
					updatedSettings.minimalServerLogs = variables.enabled
					break
				}

				queryClient.setQueryData(privacySettingsQueryKeys.settings(), updatedSettings)
			}

			// Return a context object with the snapshot value
			return {previousSettings}
		},
		onError: (err, variables, context) => {
			// If the mutation fails, use the context to roll back
			if (context?.previousSettings) {
				queryClient.setQueryData(privacySettingsQueryKeys.settings(), context.previousSettings)
			}
		},
		onSettled: () => {
			// Always refetch after error or success to ensure data consistency
			queryClient.invalidateQueries({queryKey: privacySettingsQueryKeys.settings()})
		},
		...options
	})
}
