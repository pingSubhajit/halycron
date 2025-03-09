import {useCallback, useEffect} from 'react'
import {Upload, AlertCircle} from 'lucide-react'
import {useDropzone} from 'react-dropzone'
import {cn} from '@halycron/ui/lib/utils'
import {Photo} from '@/app/api/photos/types'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import {AnimatePresence} from 'framer-motion'
import {motion} from 'motion/react'
import {usePhotoUpload} from '@/hooks/use-photo-upload'
import {ACCEPTED_IMAGE_FORMATS, MAX_IMAGE_SIZE} from '@/lib/constants'
import {toast} from 'sonner'
import {Portal} from '@radix-ui/react-portal'

type Props = {
	onPhotoUploaded?: (photo: Photo) => void
}

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const PhotoUpload = ({onPhotoUploaded}: Props) => {
	const {uploadStates, showProgress, onDrop} = usePhotoUpload({
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
			{/* Upload Progress */}
			<AnimatePresence>
				{Object.entries(uploadStates).length > 0 && showProgress && (
					<Portal>
						<motion.div
							initial={{opacity: 0, scale: 0.8}}
							animate={{opacity: 1, scale: 1}}
							exit={{opacity: 0, scale: 0.8}}
							className="fixed bottom-4 right-4 w-80 max-h-[250px] flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[100]"
						>
							<div className="overflow-y-auto flex flex-col-reverse gap-2">
								{Object.entries(uploadStates).map(([fileName, state]) => (
									<div
										key={fileName}
										className={cn(
											'w-full text-sm flex items-center justify-between gap-2 px-2 py-1 bg-accent rounded-sm',
											state.status !== 'uploaded' && state.status !== 'error' && 'animate-pulse'
										)}
									>
										<p className="truncate opacity-80">{fileName}</p>

										{(state.status === 'uploaded' || state.status === 'error') && <div className={cn(
											'text-yellow-300 flex items-center gap-1',
											state.status === 'uploaded' && 'text-primary',
											state.status === 'error' && 'text-red-500'
										)}>
											<span>{state.status}</span>
											{state.status === 'error' && <AlertCircle className="h-4 w-4" />}
										</div>}

										{state.status !== 'uploaded' && state.status !== 'error' && <TextShimmer duration={1}>
											{state.status}
										</TextShimmer>}
									</div>
								))}
							</div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			<div
				{...getRootProps()}
				className={cn(
					'w-full h-full flex flex-col items-center justify-center transition-all duration-200 bg-transparent',
					isDragActive && 'backdrop-blur-sm [box-shadow:inset_0_0_30px_hsl(var(--primary))]'
				)}
				onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the gallery
			>
				<input {...getInputProps()} />
				<div className={cn(
					'transition-opacity duration-200',
					isDragActive ? 'opacity-100' : 'opacity-0'
				)} />
			</div>
		</div>
	)
}
