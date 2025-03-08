import {useCallback, useEffect, useRef, useState} from 'react'
import {Upload} from 'lucide-react'
import {useDropzone} from 'react-dropzone'
import {cn} from '@halycron/ui/lib/utils'
import {UploadState} from '@/app/api/photos/types'
import {useUploadPhoto} from '@/app/api/photos/mutation'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {AnimatePresence} from 'framer-motion'
import {motion} from 'motion/react'

export const PhotoUpload = () => {
	const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})
	const [showProgress, setShowProgress] = useState(false)
	const {mutate: uploadFile} = useUploadPhoto(setUploadStates)
	const uploadQueue = useRef<File[]>([])
	const processingFiles = useRef<Set<string>>(new Set())
	const queryClient = useQueryClient()
	const hasSuccessfulUploads = useRef(false)

	const checkAndInvalidateQueries = useCallback(() => {
		// Only invalidate if there are no more processing files, and we had at least one successful upload
		if (processingFiles.current.size === 0 && hasSuccessfulUploads.current) {
			queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
			hasSuccessfulUploads.current = false // Reset for next batch
		}
	}, [queryClient])

	const processQueue = useCallback(() => {
		if (!showProgress) setShowProgress(true)

		const availableSlots = 10 - processingFiles.current.size
		if (availableSlots <= 0 || uploadQueue.current.length === 0) return

		const filesToProcess = uploadQueue.current.slice(0, availableSlots)
		uploadQueue.current = uploadQueue.current.slice(availableSlots)

		filesToProcess.forEach(file => {
			processingFiles.current.add(file.name)
			uploadFile(file)
			setUploadStates(prev => ({
				...prev,
				[file.name]: {progress: 0, status: 'idle'}
			}))
		})
	}, [uploadFile])

	useEffect(() => {
		const completedFiles = Object.entries(uploadStates).filter(
			([_, state]) => state.status === 'uploaded' || state.status === 'error'
		)

		if (completedFiles.length > 0) {
			completedFiles.forEach(([fileName, state]) => {
				processingFiles.current.delete(fileName)
				if (state.status === 'uploaded') {
					hasSuccessfulUploads.current = true
				}
			})

			checkAndInvalidateQueries()
		}

		if (uploadQueue.current.length > 0) {
			processQueue()
		}
	}, [uploadStates, processQueue, checkAndInvalidateQueries])

	const onDrop = useCallback((acceptedFiles: File[]) => {
		uploadQueue.current.push(...acceptedFiles)
		processQueue()
	}, [processQueue])

	const {getRootProps, getInputProps, isDragActive} = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.raw']
		},
		maxSize: 50 * 1024 * 1024, // 50MB
		noClick: true, // Disable click to open file dialog since we're using it as an overlay
		preventDropOnDocument: true // Prevent drops outside our zone from opening files in the browser
	})

	useEffect(() => {
		if (showProgress && !Object.entries(uploadStates).find(([_, state]) => state.status !== 'uploaded' && state.status !== 'error')) {
			setTimeout(() => {
				setShowProgress(false)
			}, 3000)
		}
	}, [uploadStates, showProgress])

	return (
		<div className="w-full h-full">
			{/* Upload Progress */}
			<AnimatePresence>
				{Object.entries(uploadStates).length > 0 && showProgress && <motion.div
					initial={{opacity: 0, scale: 0.8}}
					animate={{opacity: 1, scale: 1}}
					exit={{opacity: 0, scale: 0.8}}
					className="absolute top-4 right-4 w-80 h-[200px] flex flex-col-reverse overflow-y-auto gap-2 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-lg z-50"
				>
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
							</div>}

							{state.status !== 'uploaded' && state.status !== 'error' && <TextShimmer duration={1}>
								{state.status}
							</TextShimmer>}
						</div>
					))}
				</motion.div>}
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
				)}>
					<Upload className="mx-auto h-12 w-12 text-primary" />
					<p className="mt-2 text-sm text-primary font-medium">
						Drop your photos here...
					</p>
					<p className="text-xs text-primary/80 mt-1">
						Supported formats: JPG, JPEG, PNG, HEIC, RAW (Max: 50MB)
					</p>
				</div>
			</div>
		</div>
	)
}
