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
