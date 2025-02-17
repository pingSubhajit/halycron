export const fetchPhotos = async () => {
	const response = await fetch('/api/photos')
	if (!response.ok) {
		throw new Error('Failed to fetch photos')
	}
	return await response.json()
}

export const getPreSignedUploadUrl = async (name: string, type: string) => {
	const response = await fetch('/api/photos/upload-url', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			fileName: name,
			contentType: type
		})
	})

	if (!response.ok) {
		throw new Error('Failed to get upload URL')
	}

	const {uploadUrl, fileKey} = await response.json()
	return {uploadUrl, fileKey}
}

export const uploadEncryptedPhoto = async (file: File, uploadUrl: string) => {
	const uploadResponse = await fetch(uploadUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
			'x-amz-server-side-encryption': 'AES256'
		}
	})

	if (!uploadResponse.ok) {
		throw new Error('Upload failed')
	}

	return uploadResponse
}

export const savePhotoToDB = async (
	fileKey: string,
	key: string,
	iv: string,
	name: string,
	mimeType: string,
	imageWidth?: number,
	imageHeight?: number
) => {
	await fetch('/api/photos', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			fileKey,
			encryptedKey: key,
			keyIv: iv,
			originalFilename: name,
			mimeType,
			imageWidth,
			imageHeight
		})
	})
}

export const deletePhoto = async (photoId: string) => {
	const response = await fetch('/api/photos', {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({photoId})
	})

	if (!response.ok) {
		throw new Error('Failed to delete photo')
	}

	return response.json()
}
