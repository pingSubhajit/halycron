'use client'

import {useState} from 'react'
import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAllPhotos} from '@/app/api/photos/query'
import {useDeletePhoto} from '@/app/api/photos/mutation'
import dynamic from 'next/dynamic'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

export const PhotoView = () => {
	const [isOpen, setIsOpen] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)

	const {data: photos, isLoading, isError} = useAllPhotos()

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

	if (isLoading) {
		return <div>Loading...</div>
	}

	if (isError) {
		return <div>Error loading photos</div>
	}

	return (
		<div>
			<Gallery photos={photos!} onClick={(_, index) => {
				setCurrentIndex(index)
				setIsOpen(true)
			}} onDelete={onDelete} />

			{/* {isOpen && <Lightbox*/}
			{/*	images={photos.map((photo) => photo.url)}*/}
			{/*	isOpen={isOpen}*/}
			{/*	onClose={() => setIsOpen(false)}*/}
			{/*	currentIndex={currentIndex}*/}
			{/*	setCurrentIndex={setCurrentIndex}*/}
			{/*	onDelete={() => {*/}
			{/*		const photo = photos[currentIndex]*/}
			{/*		if (photo) {*/}
			{/*			onDelete(photo)*/}
			{/*			setIsOpen(false)*/}
			{/*		}*/}
			{/*	}}*/}
			{/* />}*/}
		</div>
	)
}
