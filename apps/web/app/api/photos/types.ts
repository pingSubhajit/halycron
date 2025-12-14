export type Photo = {
	id: string
	url: string
	s3Key: string
	// Legacy plaintext filename (v0). For v1, this is null and the client decrypts encryptedFilename.
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

export interface UploadState {
	progress: number;
	status: 'idle' | 'uploading' | 'encrypting' | 'uploaded' | 'error';
	error?: string;
}
