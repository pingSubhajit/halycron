import {useMutation, useQuery} from '@tanstack/react-query'
import {Platform} from 'react-native'

// In-memory cookie jar for PIN-protected share access (per app process).
const sharedCookieJar = new Map<string, string>()

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
	mimeType: string
	contentIv: string
	wrappedDekForShare: string | null
	wrappedDekForShareIv: string | null
	encryptedFilenameForShare: string | null
	filenameForShareIv: string | null
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
	requiresPin?: boolean
	pinKeyMaterial?: {
		skWrappedByPin: string
		pinKdfSalt: string
		pinKdfParams: string
		skWrapIv: string
	} | null
}

export type VerifyPinRequest = {
	token: string
	pin: string
}

export type VerifyPinResponse = {
	isValid: boolean
	cookie?: {
		name: string
		value: string
	}
}

// Query keys
export const sharedQueryKeys = {
	all: ['shared'] as const,
	details: () => [...sharedQueryKeys.all, 'detail'] as const,
	detail: (token: string) => [...sharedQueryKeys.details(), token] as const
}

// Fetch shared items
export const getSharedItems = async (token: string): Promise<GetSharedItemsResponse> => {
	const DEV_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000'
	const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL

	const cookie = sharedCookieJar.get(token)
	const response = await fetch(`${API_URL}/api/shared/${token}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(cookie ? {'Cookie': cookie} : {})
		}
	})

	if (!response.ok) {
		const error = await response.json().catch(() => ({error: `HTTP ${response.status}`}))
		throw new Error((error as any).error || 'Failed to fetch shared items')
	}

	return await response.json()
}

// Verify PIN for protected share
export const verifyPin = async (data: VerifyPinRequest): Promise<VerifyPinResponse> => {
	const DEV_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000'
	const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL

	const response = await fetch(`${API_URL}/api/shared/verify-pin`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data)
	})

	if (!response.ok) {
		const error = await response.json().catch(() => ({error: `HTTP ${response.status}`}))
		throw new Error((error as any).error || 'Failed to verify PIN')
	}

	const json = await response.json() as VerifyPinResponse
	if (json.isValid) {
		const cookieName = json.cookie?.name || `shared-access-${data.token}`
		const cookieValue = json.cookie?.value || '1'
		sharedCookieJar.set(data.token, `${cookieName}=${cookieValue}`)
	}
	return json
}

// Hook to get shared items
export const useSharedItems = (token: string) => {
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
