import {useMutation, useQuery} from '@tanstack/react-query'
import {api} from './api-client'

// Types for shared link API
export type SharedLink = {
	id: string
	token: string
	isPinProtected: boolean
	expiresAt: Date
	createdAt: Date
	photos?: Photo[]
	albums?: Album[]
}

export type Photo = {
	id: string
	s3Key: string
	originalFilename: string
	mimeType: string
	encryptedFileKey: string
	fileKeyIv: string
	imageWidth?: number
	imageHeight?: number
	createdAt: Date
	url: string
}

export type Album = {
	id: string
	name: string
	isSensitive: boolean
	isProtected: boolean
	createdAt: Date
	updatedAt: Date
	photos?: Photo[]
}

export type ShareType = 'photo' | 'album'

export type GetSharedItemsResponse = {
	shareType: ShareType
	photos?: Photo[]
	albums?: Album[]
	isPinProtected: boolean
	expiresAt: Date
}

export type VerifyPinRequest = {
	token: string
	pin: string
}

export type VerifyPinResponse = {
	isValid: boolean
}

// Query keys
export const sharedQueryKeys = {
	all: ['shared'] as const,
	details: () => [...sharedQueryKeys.all, 'detail'] as const,
	detail: (token: string) => [...sharedQueryKeys.details(), token] as const
}

// Fetch shared items
export const getSharedItems = async (token: string): Promise<GetSharedItemsResponse> => {
	return api.get<GetSharedItemsResponse>(`/api/shared/${token}`)
}

// Verify PIN for protected share
export const verifyPin = async (data: VerifyPinRequest): Promise<VerifyPinResponse> => {
	return api.post<VerifyPinResponse>('/api/shared/verify-pin', data)
}

// Hook to get shared items
export const useSharedItems = (token: string, isPinVerified: boolean = false) => {
	return useQuery({
		queryKey: sharedQueryKeys.detail(token),
		queryFn: () => getSharedItems(token),
		enabled: !!token, // Always enable if we have a token - the API will handle PIN protection
		retry: false, // Don't retry on 404s (invalid tokens)
		staleTime: 1000 * 60 * 5 // 5 minutes
	})
}

// Hook to verify PIN
export const useVerifyPin = () => {
	return useMutation({
		mutationFn: verifyPin,
		mutationKey: ['verifyPin']
	})
}
