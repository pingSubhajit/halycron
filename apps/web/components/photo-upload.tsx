import {useCallback, useEffect, useRef, useState} from 'react'
import {Upload} from 'lucide-react'
import {useDropzone} from 'react-dropzone'
import {cn} from '@halycon/ui/lib/utils'
import {UploadState} from '@/app/api/photos/types'
import {useUploadPhoto} from '@/app/api/photos/mutation'
import {TextShimmer} from '@halycon/ui/components/text-shimmer'

export const PhotoUpload = () => {
	const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})
	const {mutate: uploadFile} = useUploadPhoto(setUploadStates)
	const uploadQueue = useRef<File[]>([])
	const processingFiles = useRef<Set<string>>(new Set())

	const processQueue = useCallback(() => {
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

		completedFiles.forEach(([fileName]) => {
			processingFiles.current.delete(fileName)
		})

		if (uploadQueue.current.length > 0) {
			processQueue()
		}
	}, [uploadStates, processQueue])

	const onDrop = useCallback((acceptedFiles: File[]) => {
		uploadQueue.current.push(...acceptedFiles)
		processQueue()
	}, [processQueue])

	const {getRootProps, getInputProps, isDragActive} = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.raw']
		},
		maxSize: 50 * 1024 * 1024 // 50MB
	})

	return (
		<div className="w-full">
			{/* Upload Progress */}
			{Object.entries(uploadStates).length > 0 && <div className="h-[200px] flex flex-col-reverse overflow-y-auto gap-2">
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
			</div>}

			<div
				{...getRootProps()}
				className={`mt-4 border-2 border-dashed p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
			>
				<input {...getInputProps()} />
				<Upload className="mx-auto h-12 w-12 text-gray-400" />
				<p className="mt-2 text-sm text-gray-600">
					{isDragActive
						? 'Drop the files here...'
						: 'Drag \'n\' drop some files here, or click to select files'}
				</p>
				<p className="text-xs text-gray-500 mt-1">
					Supported formats: JPG, JPEG, PNG, HEIC, RAW (Max: 50MB)
				</p>
			</div>
		</div>
	)
}
