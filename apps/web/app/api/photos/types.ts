export type Photo = {
	id: string
	url: string
	originalFilename: string
	createdAt: Date | null
	encryptedKey: string
	keyIv: string
	mimeType: string
	imageWidth: number | null
	imageHeight: number | null
}

export interface UploadState {
	progress: number;
	status: 'idle' | 'uploading' | 'encrypting' | 'success' | 'error';
	error?: string;
}
