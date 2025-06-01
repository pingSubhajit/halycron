import {useMutation} from '@tanstack/react-query'
import {CreateShareLinkRequest, CreateShareLinkResponse} from './types'
import {api} from './api-client'

export const createShareLink = async (data: CreateShareLinkRequest): Promise<CreateShareLinkResponse> => {
	return api.post<CreateShareLinkResponse>('/api/shared', data)
}

export const useCreateShareLink = () => {
	return useMutation({
		mutationFn: createShareLink,
		mutationKey: ['createShareLink']
	})
} 