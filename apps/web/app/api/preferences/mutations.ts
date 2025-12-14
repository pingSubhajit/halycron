import {MutationOptions, useMutation, useQueryClient} from '@tanstack/react-query'
import {api} from '@/lib/data/api-client'
import {userPreferencesQueryKeys} from '@/app/api/preferences/keys'
import {UpdateUserPreferenceRequest, UserPreferencesResponse} from '@/app/api/preferences/types'

type UpdateUserPreferenceContext = {
	previousPreferences: UserPreferencesResponse | undefined
}

export const useUpdateUserPreference = (
	options?: MutationOptions<void, Error, UpdateUserPreferenceRequest, UpdateUserPreferenceContext>
) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (request: UpdateUserPreferenceRequest): Promise<void> => {
			await api.put('/api/preferences', request)
		},
		onMutate: async (variables): Promise<UpdateUserPreferenceContext> => {
			await queryClient.cancelQueries({queryKey: userPreferencesQueryKeys.preferences()})

			const previousPreferences = queryClient.getQueryData<UserPreferencesResponse>(
				userPreferencesQueryKeys.preferences()
			)

			if (previousPreferences) {
				const updated = {...previousPreferences}
				switch (variables.preferenceId) {
				case 'inactivity-auto-logout':
					updated.inactivityAutoLogoutEnabled = variables.enabled
					break
				}
				queryClient.setQueryData(userPreferencesQueryKeys.preferences(), updated)
			}

			return {previousPreferences}
		},
		onError: (err, variables, context) => {
			if (context?.previousPreferences) {
				queryClient.setQueryData(userPreferencesQueryKeys.preferences(), context.previousPreferences)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({queryKey: userPreferencesQueryKeys.preferences()})
		},
		...options
	})
}


