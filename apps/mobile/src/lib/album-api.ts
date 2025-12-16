import {api} from './api-client'
import {
	Album,
	CreateAlbumInput,
	UpdateAlbumInput,
	PhotoToAlbum,
	VerifyPinInput,
	VerifyPinResponse
} from './album-types'
import {Photo} from './types'

// Query keys for React Query
export const albumQueryKeys = {
	all: ['albums'] as const,
	allAlbums: () => [...albumQueryKeys.all, 'list'] as const,
	album: (id: string) => [...albumQueryKeys.all, 'detail', id] as const,
	albumPhotos: (id: string) => [...albumQueryKeys.all, 'photos', id] as const
}

// In-memory PIN verification state (session-based)
// NOTE: We store the album access token separately from the main auth cookie so we don't
// accidentally clobber the user's session cookie when verifying PINs.
const verifiedAlbums = new Map<string, {verified: boolean; expiresAt: Date; accessToken?: string}>()

export const isAlbumVerified = (albumId: string): boolean => {
	const state = verifiedAlbums.get(albumId)
	if (!state) return false
	if (state.expiresAt < new Date()) {
		verifiedAlbums.delete(albumId)
		return false
	}
	return state.verified
}

export const setAlbumVerified = (albumId: string, expiresAt: Date): void => {
	verifiedAlbums.set(albumId, {verified: true, expiresAt})
}

export const clearAlbumVerification = (albumId: string): void => {
	verifiedAlbums.delete(albumId)
}

export const getAlbumAccessToken = (albumId: string): string | undefined => {
	return verifiedAlbums.get(albumId)?.accessToken
}

export const setAlbumAccessToken = (albumId: string, accessToken: string | undefined): void => {
	const existing = verifiedAlbums.get(albumId)
	if (existing) {
		verifiedAlbums.set(albumId, {...existing, accessToken})
	} else if (accessToken) {
		// If we only have a token but no expiry, default to 5 minutes.
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
		verifiedAlbums.set(albumId, {verified: true, expiresAt, accessToken})
	}
}

// API Functions

/**
 * Fetch all albums for the current user
 */
export const getAllAlbums = async (): Promise<Album[]> => {
	return api.get<Album[]>('/api/albums')
}

/**
 * Fetch a single album by ID
 */
export const getAlbum = async (id: string): Promise<Album> => {
	const accessToken = getAlbumAccessToken(id)
	return api.get<Album>(`/api/albums/${id}`, {
		headers: accessToken ? {'X-Album-Access-Token': accessToken} : undefined
	})
}

/**
 * Create a new album
 */
export const createAlbum = async (input: CreateAlbumInput): Promise<Album> => {
	return api.post<Album>('/api/albums', input)
}

/**
 * Update an existing album
 */
export const updateAlbum = async (input: UpdateAlbumInput): Promise<Album> => {
	const {id, ...data} = input
	return api.patch<Album>(`/api/albums/${id}`, data)
}

/**
 * Delete an album
 */
export const deleteAlbum = async (id: string): Promise<void> => {
	await api.delete(`/api/albums/${id}`)
}

/**
 * Fetch photos in an album
 */
export const getAlbumPhotos = async (albumId: string): Promise<Photo[]> => {
	const accessToken = getAlbumAccessToken(albumId)
	return api.get<Photo[]>(`/api/albums/${albumId}/photos`, {
		headers: accessToken ? {'X-Album-Access-Token': accessToken} : undefined
	})
}

/**
 * Add photos to an album
 */
export const addPhotosToAlbum = async (
	albumId: string,
	photoIds: string[]
): Promise<PhotoToAlbum[]> => {
	return api.post<PhotoToAlbum[]>(`/api/albums/${albumId}/photos`, {photoIds})
}

/**
 * Remove photos from an album
 */
export const removePhotosFromAlbum = async (
	albumId: string,
	photoIds: string[]
): Promise<void> => {
	await api.delete(`/api/albums/${albumId}/photos`, {body: {photoIds}})
}

/**
 * Verify PIN for a protected album
 */
export const verifyAlbumPin = async (
	albumId: string,
	input: VerifyPinInput
): Promise<VerifyPinResponse> => {
	const response = await api.post<VerifyPinResponse>(
		`/api/albums/${albumId}/verify-pin`,
		input
	)
	
	// Store verification state on success
	if (response.verified && response.expiresAt) {
		setAlbumVerified(albumId, new Date(response.expiresAt))
		// Store the album access token for header-based auth (mobile-safe)
		setAlbumAccessToken(albumId, response.accessToken)
	}
	
	return response
}

/**
 * Lock a protected album (clear verification)
 */
export const lockAlbum = async (albumId: string): Promise<void> => {
	await api.post(`/api/albums/${albumId}/lock`)
	clearAlbumVerification(albumId)
	setAlbumAccessToken(albumId, undefined)
}

