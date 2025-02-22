'use client'

import {useEffect, useState} from 'react'
import {Lightbox} from '@halycon/ui/components/lightbox'
import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAllPhotos} from '@/app/api/photos/query'
import {useDeletePhoto} from '@/app/api/photos/mutation'
import dynamic from 'next/dynamic'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

export const PhotoView = () => {
	const [loaded, setLoaded] = useState(0)
	const [photos, setPhotos] = useState<Photo[]>([])
	const [dimensions, setDimensions] = useState<{width: number, height: number, id: string}[]>([])
	const [totalPhotos, setTotalPhotos] = useState(0)
	const [isOpen, setIsOpen] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)

	const {data: optimisticPhotos} = useAllPhotos(setTotalPhotos, setPhotos, setLoaded, setDimensions)

	useEffect(() => {
		if (optimisticPhotos) {
			setPhotos(optimisticPhotos)
		}
	}, [optimisticPhotos])

	const {mutate: deletePhoto} = useDeletePhoto({
		onSuccess: () => {
			toast.success('Photo deleted successfully')
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : 'Failed to delete photo')
		}
	})

	const onDelete = (photo: Photo) => {
		deletePhoto(photo.id)
	}

	return (
		<div>
			<Gallery photos={photos} onClick={(_, index) => {
				setCurrentIndex(index)
				setIsOpen(true)
			}} onDelete={onDelete} totalPhotos={totalPhotos} loaded={loaded} dimensions={dimensions} />

			{isOpen && <Lightbox
				images={photos.map((photo) => photo.url)}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				currentIndex={currentIndex}
				setCurrentIndex={setCurrentIndex}
				onDelete={() => {
					const photo = photos[currentIndex]
					if (photo) {
						onDelete(photo)
						setIsOpen(false)
					}
				}}
			/>}
		</div>
	)
}
