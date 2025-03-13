import {useEffect} from 'react'
import {AlertCircle} from 'lucide-react'
import {useDropzone} from 'react-dropzone'
import {cn} from '@halycron/ui/lib/utils'
import {Photo} from '@/app/api/photos/types'
import {usePhotoUpload} from '@/hooks/use-photo-upload'
import {ACCEPTED_IMAGE_FORMATS, MAX_IMAGE_SIZE} from '@/lib/constants'
import {toast} from 'sonner'
import {UploadProgress} from './upload-progress'
import {AnimatePresence, motion} from 'motion/react'

type Props = {
	onPhotoUploaded?: (photo: Photo) => void
}

export const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
					return `File is too large. Max size is ${formatFileSize(MAX_IMAGE_SIZE)}`
				case 'file-invalid-type':
					return `Invalid file type. Accepted formats: ${Object.values(ACCEPTED_IMAGE_FORMATS)
						.flat()
						.join(', ')}`
				default:
					return error.message
				}
			})

			toast.error(`Error with ${file.name}: ${errorMessages.join(', ')}`, {
				icon: <AlertCircle className="h-5 w-5" />
			})
		})
	}, [fileRejections])

	return (
		<div className="w-full h-full">
			<UploadProgress
				uploadStates={uploadStates}
				showProgress={showProgress}
				className="w-80 max-h-[250px]"
				onHoverChange={onProgressHoverChange}
			/>

			<div
				{...getRootProps()}
				className={cn(
					'w-full h-full flex flex-col items-center justify-center transition-all duration-200 bg-transparent',
					isDragActive && 'bg-dark/80 backdrop-blur-md'
				)}
				onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the gallery
			>
				<input {...getInputProps()} />

				<AnimatePresence>
					{isDragActive && <motion.div
						key="drag-active"
						className="flex flex-col justify-center items-center gap-2"
						initial={{opacity: 0, y: -20}}
						animate={{opacity: 1, y: 0}}
						exit={{opacity: 0, y: -20}}
					>
						<p className="text-2xl">Ready when you are</p>
					</motion.div>}
				</AnimatePresence>
			</div>
		</div>
	)
}
