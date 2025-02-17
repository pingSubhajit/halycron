'use client'

import {useEffect, useState} from 'react'
import {Lightbox} from '@halycon/ui/components/lightbox'
import {downloadAndDecryptFile} from '@/lib/utils'
import {deletePhoto, fetchPhotos} from '@/lib/photos'
import {Gallery, Photo} from '@/components/gallery'
import {toast} from 'sonner'

export const PhotoView = () => {
	const [loaded, setLoaded] = useState(0)
	const [photos, setPhotos] = useState<Photo[]>([])
	const [totalPhotos, setTotalPhotos] = useState(0)
	const [isOpen, setIsOpen] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)

	useEffect(() => {
		const fetch = async () => {
			const response = await fetchPhotos()
			setTotalPhotos(response.length)

			for (let i = 0; i < response.length; i++) {
				const photo = response[i]
				photo.url = await downloadAndDecryptFile(photo.url, photo.encryptedKey, photo.keyIv, photo.mimeType)
				setPhotos((prev) => {
					// Check if photo with this ID already exists
					if (prev.some(p => p.id === photo.id)) {
						return prev
					}
					return [...prev, photo]
				})
				setLoaded(i + 1)
			}
		}

		fetch()
	}, [])

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
			}} onDelete={onDelete} totalPhotos={totalPhotos} loaded={loaded}/>

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
