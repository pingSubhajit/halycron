'use client'

import {useState} from 'react'
import {Lightbox} from '@halycon/ui/components/lightbox'
import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAllPhotos} from '@/app/api/photos/query'
import {deletePhoto} from '@/app/api/photos/utils'
import dynamic from 'next/dynamic'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

export const PhotoView = () => {
	const [loaded, setLoaded] = useState(0)
	const [photos, setPhotos] = useState<Photo[]>([])
	const [dimensions, setDimensions] = useState<{width: number, height: number, id: string}[]>([])
	const [totalPhotos, setTotalPhotos] = useState(0)
	const [isOpen, setIsOpen] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)

	useAllPhotos(setTotalPhotos, setPhotos, setLoaded, setDimensions)

	const onDelete = async (photo: Photo) => {
		try {
			await deletePhoto(photo.id)
			setPhotos((prev) => prev.filter(p => p.id !== photo.id))
			setTotalPhotos((prev) => prev - 1)
			toast.success('Photo deleted successfully')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete photo')
		}
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
