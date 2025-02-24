'use client'

import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAlbum, useAlbumPhotos} from '@/app/api/albums/query'
import {useDeletePhoto, useRestorePhoto} from '@/app/api/photos/mutation'
import dynamic from 'next/dynamic'
import {TextShimmer} from '@halycon/ui/components/text-shimmer'
import {api} from '@/lib/data/api-client'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

interface Props {
	albumId: string
}

export const SingleAlbumView = ({albumId}: Props) => {
	const {data: album, isLoading: isLoadingAlbum, isError: isAlbumError} = useAlbum(albumId)
	const {data: photos, isLoading: isLoadingPhotos, isError: isPhotosError} = useAlbumPhotos(albumId)

	const {mutate: restorePhoto} = useRestorePhoto({
		onSuccess: () => {
			toast.success('Photo restored successfully')
		},
		onError: (error) => {
			toast.error(error.message)
		}
	})

	const cleanupS3 = async (s3Key: string) => {
		try {
			await api.post('api/photos/cleanup', {s3Key})
		} catch (error) {
			toast.error(error instanceof Error ? `Failed to cleanup S3: ${error.message}` : 'Failed to cleanup S3')
		}
	}

	const {mutate: deletePhoto} = useDeletePhoto({
		onSuccess: (deletedPhoto) => {
			toast.success('Photo deleted successfully', {
				action: {
					label: 'Undo',
					onClick: () => restorePhoto(deletedPhoto)
				},
				onDismiss: () => {
					// Clean up S3 file after toast is dismissed (user didn't click undo)
					cleanupS3(deletedPhoto.s3Key)
				}
			})
		},
		onError: (error) => {
			toast.error(error.message)
		}
	})

	const onDelete = (photo: Photo) => {
		deletePhoto(photo)
	}

	if (isLoadingAlbum || isLoadingPhotos) {
		return <TextShimmer duration={1}>
			Loading album...
		</TextShimmer>
	}

	if (isAlbumError || isPhotosError || !album || !photos) {
		return <div>Error loading album</div>
	}

	return (
		<div>
			<Gallery photos={photos} onDelete={onDelete} />
		</div>
	)
}
