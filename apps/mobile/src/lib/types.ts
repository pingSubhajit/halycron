export type Photo = {
	id: string
	url: string
	s3Key: string
	originalFilename: string | null
	createdAt: Date | null
	encryptionVersion?: number

	// v1 (E2EE)
	contentIv?: string | null
	wrappedDek?: string | null
	wrappedDekIv?: string | null
	encryptedFilename?: string | null
	filenameIv?: string | null

	// v0 (legacy)
	encryptedFileKey?: string | null
	fileKeyIv?: string | null
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

	sharePhotos?: Array<{
		photoId: string
		wrappedDekForShare: string
		wrappedDekForShareIv: string
		encryptedFilenameForShare: string
		filenameForShareIv: string
	}>

	pinWrappedShareKey?: {
		skWrappedByPin: string
		pinKdfSalt: string
		pinKdfParams: string
		skWrapIv: string
	}
}

export type CreateShareLinkResponse = {
	shareLink: SharedLink
	shareUrl: string
}
