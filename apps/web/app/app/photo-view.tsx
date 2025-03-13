'use client'

import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAllPhotos} from '@/app/api/photos/query'
import {useDeletePhoto, useRestorePhoto} from '@/app/api/photos/mutation'
import dynamic from 'next/dynamic'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import {api} from '@/lib/data/api-client'
import {PhotoUpload} from '@/components/photo-upload'
import {useEffect, useState} from 'react'
import {cn} from '@halycron/ui/lib/utils'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

export const PhotoView = () => {
	const {data: photos, isLoading, isError} = useAllPhotos()
	const [isDragging, setIsDragging] = useState(false)
	const {mutate: restorePhoto} = useRestorePhoto({
		onError: (error) => {
			toast.error(error.message)
		}
	})

	// Enable pointer events when dragging starts anywhere in the window
	useEffect(() => {
		const handleDragEnter = (e: DragEvent) => {
			if (e.dataTransfer?.types.includes('Files')) {
				setIsDragging(true)
			}
		}

		const handleDragLeave = (e: DragEvent) => {
			// Only consider it a leave if we're leaving the window
			if (e.relatedTarget === null) {
				setIsDragging(false)
			}
		}

		const handleDrop = () => {
			setIsDragging(false)
		}

		window.addEventListener('dragenter', handleDragEnter)
		window.addEventListener('dragleave', handleDragLeave)
		window.addEventListener('drop', handleDrop)

		return () => {
			window.removeEventListener('dragenter', handleDragEnter)
			window.removeEventListener('dragleave', handleDragLeave)
			window.removeEventListener('drop', handleDrop)
		}
	}, [])

	const cleanupS3 = async (s3Key: string) => {
		try {
			await api.post('api/photos/cleanup', {s3Key})
		} catch (error) {
			toast.error(error instanceof Error ? `Oops, couldn't clean up that file: ${error.message}` : 'Hmm, something went wrong with cleanup')
		}
	}

	const {mutate: deletePhoto} = useDeletePhoto({
		onSuccess: (deletedPhoto) => {
			toast.success('That photo is sent away. Need it back?', {
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

	if (isLoading) {
		return <div className="flex flex-col items-center justify-center h-96">
			<TextShimmer duration={1}>
				Unlocking your memories . . .
			</TextShimmer>
		</div>
	}

	if (isError) {
		return <div className="flex flex-col items-center justify-center h-96">
			<p>Hmm, we ran into a hiccup loading your photos. Mind trying again?</p>
		</div>
	}

	return (
		<div className="w-full h-full">
			{/* Gallery */}
			<div className="w-full h-full">
				<Gallery photos={photos!} onDelete={onDelete} />
			</div>

			{/* Overlay Drop Zone */}
			<div className={cn(
				'z-50 fixed w-screen h-screen top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
				isDragging ? 'pointer-events-auto' : 'pointer-events-none'
			)}>
				<PhotoUpload />
			</div>
		</div>
	)
}
