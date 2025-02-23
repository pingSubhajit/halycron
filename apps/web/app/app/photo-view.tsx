'use client'

import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAllPhotos} from '@/app/api/photos/query'
import {useDeletePhoto} from '@/app/api/photos/mutation'
import dynamic from 'next/dynamic'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

export const PhotoView = () => {
	const {data: photos, isLoading, isError} = useAllPhotos()

	const {mutate: deletePhoto} = useDeletePhoto({
		onSuccess: () => {
			toast.success('Photo deleted successfully')
		},
		onError: (error) => {
			toast.error(error.message)
		}
	})

	const onDelete = (photo: Photo) => {
		deletePhoto(photo.id)
	}

	if (isLoading) {
		return <div>Loading...</div>
	}

	if (isError) {
		return <div>Error loading photos</div>
	}

	return (
		<div>
			<Gallery photos={photos!} onDelete={onDelete} />
		</div>
	)
}
