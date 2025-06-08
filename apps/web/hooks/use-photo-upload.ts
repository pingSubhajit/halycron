import {useCallback, useEffect, useRef, useState} from 'react'
import {Photo, UploadState} from '@/app/api/photos/types'
import {useUploadPhoto} from '@/app/api/photos/mutation'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {FileRejection} from 'react-dropzone'
import {usePrivacySettings} from '@/app/api/privacy-settings/query'

interface UsePhotoUploadOptions {
	onPhotoUploaded?: (photo: Photo) => void
	showProgressInitially?: boolean
}

interface UsePhotoUploadResult {
	uploadStates: Record<string, UploadState>
	showProgress: boolean
	setShowProgress: (show: boolean) => void
	onDrop: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => void
	fileRejections: FileRejection[]
	onProgressHoverChange: (isHovering: boolean) => void
}

export const usePhotoUpload = ({
	onPhotoUploaded,
	showProgressInitially = false
}: UsePhotoUploadOptions = {}): UsePhotoUploadResult => {
	const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})
	const [showProgress, setShowProgress] = useState(showProgressInitially)
	const [fileRejections, setFileRejections] = useState<FileRejection[]>([])
	const [isHovering, setIsHovering] = useState(false)
	const uploadQueue = useRef<File[]>([])
	const processingFiles = useRef<Set<string>>(new Set())
	const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const queryClient = useQueryClient()
	const hasSuccessfulUploads = useRef(false)

	// Get privacy settings from cache
	const {data: privacySettings} = usePrivacySettings()

	const {mutate: uploadFile} = useUploadPhoto(setUploadStates, privacySettings, {
		onSuccess: (photo) => {
			onPhotoUploaded?.(photo)
		}
	})

	const checkAndInvalidateQueries = useCallback(() => {
		if (processingFiles.current.size === 0 && hasSuccessfulUploads.current) {
			queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
			hasSuccessfulUploads.current = false
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
	}, [uploadFile, showProgress])

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

	// Handle progress window visibility
	useEffect(() => {
		// Clear any existing timeout
		if (hideTimeoutRef.current) {
			clearTimeout(hideTimeoutRef.current)
			hideTimeoutRef.current = null
		}

		/*
		 * Only start the hide timeout if:
		 * 1. The progress window is shown
		 * 2. We're not hovering over it
		 * 3. All uploads are complete (either success or error)
		 */
		if (
			showProgress && !isHovering && !Object.entries(uploadStates).find(
				([_, state]) => state.status !== 'uploaded' && state.status !== 'error'
			)
		) {
			hideTimeoutRef.current = setTimeout(() => {
				setShowProgress(false)
			}, 3000)
		}

		return () => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current)
			}
		}
	}, [uploadStates, showProgress, isHovering])

	const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
		setFileRejections(rejectedFiles)
		uploadQueue.current.push(...acceptedFiles)
		processQueue()
	}, [processQueue])

	const onProgressHoverChange = useCallback((isHovering: boolean) => {
		setIsHovering(isHovering)
	}, [])

	return {
		uploadStates,
		showProgress,
		setShowProgress,
		onDrop,
		fileRejections,
		onProgressHoverChange
	}
}
