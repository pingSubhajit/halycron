'use client'

import {useState} from 'react'
import {Lightbox} from '@halycon/ui/components/lightbox'
import {Gallery} from '@/components/gallery'
import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAllPhotos} from '@/app/api/photos/query'
import {deletePhoto} from '@/app/api/photos/utils'

export const fetchPhotos = async () => {
	const response = await fetch('/api/photos')
	if (!response.ok) {
		throw new Error('Failed to fetch photos')
	}
	return await response.json()
}

export const PhotoView = () => {
	const [loaded, setLoaded] = useState(0)
	const [photos, setPhotos] = useState<Photo[]>([])
	const [dimensions, setDimensions] = useState<{width: number, height: number}[]>([])
	const [totalPhotos, setTotalPhotos] = useState(0)
	const [isOpen, setIsOpen] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)

	useAllPhotos(setTotalPhotos, setPhotos, setLoaded, setDimensions)

	/*
	 * useEffect(() => {
	 * 	const fetch = async () => {
	 * 		const response = await fetchPhotos()
	 * 		setTotalPhotos(response.length)
	 *
	 * 		for (let i = 0; i < response.length; i++) {
	 * 			const photo = response[i]
	 * 			photo.url = await downloadAndDecryptFile(photo.url, photo.encryptedKey, photo.keyIv, photo.mimeType)
	 * 			setPhotos((prev) => {
	 * 				// Check if photo with this ID already exists
	 * 				if (prev.some(p => p.id === photo.id)) {
	 * 					return prev
	 * 				}
	 * 				return [...prev, photo]
	 * 			})
	 * 			setLoaded(i + 1)
	 * 		}
	 * 	}
	 *
	 * 	fetch()
	 * }, [])
	 */

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
