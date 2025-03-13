'use client'

import {useEffect} from 'react'
import {AlertCircle} from 'lucide-react'
import {useDropzone} from 'react-dropzone'
import {cn} from '@halycron/ui/lib/utils'
import {Photo} from '@/app/api/photos/types'
import {usePhotoUpload} from '@/hooks/use-photo-upload'
import {ACCEPTED_IMAGE_FORMATS, MAX_IMAGE_SIZE} from '@/lib/constants'
import {toast} from 'sonner'
import {UploadProgress} from '@/components/upload-progress'

type Props = {
	onPhotoUploaded?: (photo: Photo) => void
}

export const formatFileSize = (bytes: number): string => {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
	if (bytes === 0) return '0 Byte'
	const i = Math.floor(Math.log(bytes) / Math.log(1024))
	return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`
}

export const PhotoUpload = ({onPhotoUploaded}: Props) => {
	const {uploadStates, showProgress, onDrop, onProgressHoverChange} = usePhotoUpload({
		onPhotoUploaded
	})

	const {getRootProps, getInputProps, isDragActive, fileRejections} = useDropzone({
		onDrop,
		accept: ACCEPTED_IMAGE_FORMATS,
		maxSize: MAX_IMAGE_SIZE,
		noClick: true, // Disable click to open file dialog since we're using it as an overlay
		preventDropOnDocument: true // Prevent drops outside our zone from opening files in the browser
	})

	// Handle file rejections
	useEffect(() => {
		fileRejections.forEach(({file, errors}) => {
			const errorMessages = errors.map(error => {
				switch (error.code) {
				case 'file-too-large':
					return `This one's a bit too hefty. Max size is ${formatFileSize(MAX_IMAGE_SIZE)}`
				case 'file-invalid-type':
					return `Hmm, we can't work with this file type. We accept: ${Object.values(ACCEPTED_IMAGE_FORMATS)
						.flat()
						.join(', ')}`
				default:
					return error.message
				}
			})

			toast.error(`Oops! Issue with ${file.name}: ${errorMessages.join(', ')}`, {
				icon: <AlertCircle className="h-5 w-5" />
			})
		})
	}, [fileRejections])

	return (
		<div
			{...getRootProps()}
			className={cn(
				'w-screen h-screen bg-background/30 backdrop-blur-sm fixed inset-0 flex items-center justify-center drop-shadow-2xl z-50',
				isDragActive ? 'opacity-100' : 'opacity-0',
				'transition-opacity duration-200'
			)}
		>
			<input {...getInputProps()} />
			<div
				className="bg-neutral-900 border-2 border-dashed border-primary/60 rounded-lg p-16 max-w-xl w-full mx-4">
				<div className="flex flex-col items-center justify-center gap-2">
					<p className="text-2xl font-medium text-center text-neutral-100">Ready when you are!</p>
					<p className="text-center text-neutral-400">
						Just drop your photos here to add them to your private vault
					</p>
				</div>
			</div>

			<UploadProgress
				uploadStates={uploadStates}
				showProgress={showProgress}
				onHoverChange={onProgressHoverChange}
			/>
		</div>
	)
}
