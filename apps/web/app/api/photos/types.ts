export type Photo = {
	id: string
	url: string
	s3Key: string
	originalFilename: string
	createdAt: Date | null
	encryptedFileKey: string
	fileKeyIv: string
	fileIv: string  // IV used for file encryption
	mimeType: string
	imageWidth: number | null
	imageHeight: number | null
	albums?: {
		id: string
		name: string
	}[]
}

export interface UploadState {
	progress: number;
	status: 'idle' | 'uploading' | 'encrypting' | 'uploaded' | 'error';
	error?: string;
}
