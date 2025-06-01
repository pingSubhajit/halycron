export type Photo = {
	id: string
	url: string
	s3Key: string
	originalFilename: string
	createdAt: Date | null
	encryptedFileKey: string
	fileKeyIv: string
	mimeType: string
	imageWidth: number | null
	imageHeight: number | null
	albums?: {
		id: string
		name: string
	}[]
}

export type UploadState = {
	progress: number
	status: 'idle' | 'encrypting' | 'uploading' | 'uploaded' | 'error'
	error?: string
	imageUri?: string
}

// Share Link Types
export type ExpiryOption = '5min' | '15min' | '30min' | '1h' | '8h' | '24h' | '3d' | '7d' | '30d'

export type ShareType = 'photo' | 'album'

export type SharedLink = {
	id: string
	token: string
	isPinProtected: boolean
	expiresAt: Date
	createdAt: Date
	photos?: Photo[]
}

export type CreateShareLinkRequest = {
	photoIds?: string[]
	albumIds?: string[]
	expiryOption: ExpiryOption
	pin?: string
}

export type CreateShareLinkResponse = {
	shareLink: SharedLink
	shareUrl: string
}
