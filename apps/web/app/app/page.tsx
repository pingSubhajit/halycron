'use client'

import {useEffect, useState} from 'react'
import Image from 'next/image'
import {Lightbox} from '@halycon/ui/components/lightbox'
import {downloadAndDecryptFile} from '@/lib/utils'
import {fetchPhotos} from '@/lib/photos'

type Photo = {
	id: string
	url: string
	originalFilename: string
	createdAt: string
}

const ImageSkeleton = () => (
	<div className="relative overflow-hidden rounded-lg bg-accent animate-pulse" style={{paddingBottom: '75%'}}>
		<div className="absolute inset-0" />
	</div>
)

const ApplicationHome = () => {
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

	return (
		<div>
			<div className="columns-1 gap-2 lg:gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>div:not(:first-child)]:mt-2 lg:[&>div:not(:first-child)]:mt-4">
				{photos.map((photo, index) => (
					<div
						key={photo.id}
						className="break-inside-avoid transition-transform hover:scale-[1.02] duration-200"
						onClick={() => {
							setCurrentIndex(index)
							setIsOpen(true)
						}}
					>
						<div className="relative rounded-lg overflow-hidden">
							<Image
								src={photo.url}
								alt={photo.originalFilename}
								width={800}
								height={600}
								className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
							/>
						</div>
					</div>
				))}

				{Array.from({length: totalPhotos - loaded}).map((_, index) => (
					<div key={`skeleton-${index}`} className="break-inside-avoid">
						<ImageSkeleton />
					</div>
				))}
			</div>

			{isOpen && <Lightbox
				images={photos.map((photo) => photo.url)}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				currentIndex={currentIndex}
				setCurrentIndex={setCurrentIndex}
			/>}
		</div>
	)
}

export default ApplicationHome
