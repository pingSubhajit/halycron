import {MutationOptions, useMutation} from '@tanstack/react-query'
import {api} from '@/lib/data/api-client'

export type UpdateProfileInput = {
	name?: string
	image?: string
}

export type User = {
	id: string
	name: string
	email: string
	emailVerified: boolean
	image?: string
	twoFactorEnabled: boolean
	createdAt: string
	updatedAt: string
}

export const useUpdateProfile = (options?: MutationOptions<User, Error, UpdateProfileInput>) => {
	return useMutation({
		mutationFn: async (input: UpdateProfileInput) => {
			return api.patch<User>('/api/profile', input)
		},
		...options
	})
}
