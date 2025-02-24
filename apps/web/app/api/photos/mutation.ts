import {MutationOptions, useMutation, useQueryClient} from '@tanstack/react-query'
import {SetStateAction} from 'react'
import {Photo, UploadState} from '@/app/api/photos/types'
import {
	encryptFile,
	generateEncryptionKey,
	getImageDimensions,
	getPreSignedUploadUrl,
	savePhotoToDB,
	uploadEncryptedPhoto
} from '@/app/api/photos/utils'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {api} from '@/lib/data/api-client'

type DeletePhotoContext = {
	previousPhotos: Photo[] | undefined
}

export const useDeletePhoto = (options?: MutationOptions<Photo, Error, Photo, DeletePhotoContext>) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (photo: Photo) => {
			const response = await api.delete<Photo>('api/photos', {
				body: {photoId: photo.id}
			})
			return response // Return the server response which includes full photo data
		},
		onMutate: async (photo): Promise<DeletePhotoContext> => {
			// Cancel any outgoing re-fetches
			await queryClient.cancelQueries({queryKey: photoQueryKeys.allPhotos()})

			// Snapshot the previous value
			const previousPhotos = queryClient.getQueryData<Photo[]>(photoQueryKeys.allPhotos())

			// Optimistically update to the new value
			if (previousPhotos) {
				queryClient.setQueryData<Photo[]>(
					photoQueryKeys.allPhotos(),
					previousPhotos.filter(p => p.id !== photo.id)
				)
			}

			// Return a context object with the snapshot value
			return {previousPhotos}
		},
		onError: (err, photo, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousPhotos) {
				queryClient.setQueryData(photoQueryKeys.allPhotos(), context.previousPhotos)
			}
		},
		...options
	})
}

export const useUploadPhoto = (
	setUploadStates: (value: SetStateAction<Record<string, UploadState>>) => void,
	options?: MutationOptions<Photo, Error, File>
) => {
	return useMutation({
		mutationFn: async (file: File) => {
			try {
				// Get image dimensions
				const dimensions = await getImageDimensions(file)

				// Generate a secure random encryption key
				const encryptionKey = generateEncryptionKey()

				// Update state to encrypting
				setUploadStates(prev => ({
					...prev,
					[file.name]: {progress: 0, status: 'encrypting'}
				}))

				// Encrypt the file
				const {encryptedFile, iv, key} = await encryptFile(file, encryptionKey)

				// Get pre-signed URL
				const {uploadUrl, fileKey} = await getPreSignedUploadUrl(file.name, file.type)

				// Update state to uploading
				setUploadStates(prev => ({
					...prev,
					[file.name]: {progress: 0, status: 'uploading'}
				}))

				// Upload encrypted file
				await uploadEncryptedPhoto(encryptedFile, uploadUrl)

				// Save encryption details to database
				const response = await savePhotoToDB(
					fileKey,
					key,
					iv,
					file.name,
					file.type,
					dimensions.width,
					dimensions.height
				)

				// Update state to success
				setUploadStates(prev => ({
					...prev,
					[file.name]: {progress: 100, status: 'uploaded'}
				}))

				return response
			} catch (error) {
				setUploadStates(prev => ({
					...prev,
					[file.name]: {
						progress: 0,
						status: 'error',
						error: error instanceof Error ? error.message : 'Upload failed'
					}
				}))

				throw error
			}
		},
		...options
	})
}

export const useRestorePhoto = (options?: MutationOptions<void, Error, Photo, DeletePhotoContext>) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (photo: Photo) => {
			const photoData = {
				id: photo.id,
				s3Key: photo.s3Key,
				originalFilename: photo.originalFilename,
				createdAt: photo.createdAt,
				encryptedFileKey: photo.encryptedFileKey,
				fileKeyIv: photo.fileKeyIv,
				mimeType: photo.mimeType,
				imageWidth: photo.imageWidth,
				imageHeight: photo.imageHeight
			}

			await api.patch('api/photos', photoData)

			// Invalidate and refetch photos query to show the restored photo
			await queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
		},
		onMutate: async (photo): Promise<DeletePhotoContext> => {
			// Cancel any outgoing re-fetches
			await queryClient.cancelQueries({queryKey: photoQueryKeys.allPhotos()})

			// Snapshot the previous value
			const previousPhotos = queryClient.getQueryData<Photo[]>(photoQueryKeys.allPhotos())

			// Optimistically update to the new value
			if (previousPhotos) {
				queryClient.setQueryData<Photo[]>(
					photoQueryKeys.allPhotos(),
					[...previousPhotos, photo]
				)
			}

			// Return a context object with the snapshot value
			return {previousPhotos}
		},
		onError: (err, photo, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousPhotos) {
				queryClient.setQueryData(photoQueryKeys.allPhotos(), context.previousPhotos)
			}
		},
		onSettled: () => {
			// Always invalidate the photos query after mutation settles
			queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
		},
		...options
	})
}
