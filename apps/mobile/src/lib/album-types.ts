import {Photo} from './types'

export type Album = {
	id: string
	name: string
	isSensitive: boolean
	isProtected: boolean
	createdAt: Date | null
	updatedAt: Date | null
	requiresPin?: boolean
	_count?: {
		photos: number
	}
}

export type AlbumWithPhotos = Album & {
	photos?: Photo[]
}

export type CreateAlbumInput = {
	name: string
	isSensitive?: boolean
	isProtected?: boolean
	pin?: string
}

export type UpdateAlbumInput = {
	id: string
	name?: string
	isSensitive?: boolean
	isProtected?: boolean
	pin?: string
}

export type AddPhotosToAlbumInput = {
	albumId: string
	photoIds: string[]
}

export type RemovePhotosFromAlbumInput = {
	albumId: string
	photoIds: string[]
}

export type PhotoToAlbum = {
	photoId: string
	albumId: string
	createdAt: Date | null
}

export type VerifyPinInput = {
	pin: string
}

export type VerifyPinResponse = {
	verified: boolean
	accessToken?: string
	expiresAt?: string
	error?: string
}

