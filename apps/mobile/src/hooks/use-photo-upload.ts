import {useMutation, useQueryClient} from '@tanstack/react-query'
import {useCallback, useEffect, useRef, useState} from 'react'
import * as ImagePicker from 'expo-image-picker'
import {Photo, UploadState} from '../lib/types'
import {photoQueryKeys} from '../lib/photo-keys'
import {
	encryptFile,
	generateEncryptionKey,
	getImageDimensions,
	getPreSignedUploadUrl,
	savePhotoToDB,
	uploadEncryptedPhoto
} from '../lib/upload-utils'

interface UsePhotoUploadOptions {
	onPhotoUploaded?: (photo: Photo) => void
	showProgressInitially?: boolean
}

interface UsePhotoUploadResult {
	uploadStates: Record<string, UploadState>
	showProgress: boolean
	setShowProgress: (show: boolean) => void
	selectAndUploadPhotos: () => Promise<void>
	fileRejections: Array<{ fileName: string, error: string }>
	onProgressHoverChange: (isHovering: boolean) => void
}

export const usePhotoUpload = ({
	onPhotoUploaded,
	showProgressInitially = false
}: UsePhotoUploadOptions = {}): UsePhotoUploadResult => {
	const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})
	const [showProgress, setShowProgress] = useState(showProgressInitially)
	const [fileRejections, setFileRejections] = useState<Array<{ fileName: string, error: string }>>([])
	const [isHovering, setIsHovering] = useState(false)
	const uploadQueue = useRef<ImagePicker.ImagePickerAsset[]>([])
	const processingFiles = useRef<Set<string>>(new Set())
	const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const queryClient = useQueryClient()
	const hasSuccessfulUploads = useRef(false)

	const {mutate: uploadFile} = useMutation({
		mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
			try {
				const fileName = asset.fileName || `photo_${Date.now()}.jpg`

				// Get image dimensions - use asset dimensions if available, otherwise fetch them
				let dimensions: { width: number; height: number }
				if (asset.width && asset.height) {
					dimensions = {width: asset.width, height: asset.height}
				} else {
					dimensions = await getImageDimensions(asset.uri)
				}

				// Generate a secure random encryption key
				const encryptionKey = generateEncryptionKey()

				// Update state to encrypting
				setUploadStates(prev => ({
					...prev,
					[fileName]: {progress: 0, status: 'encrypting'}
				}))

				// Encrypt the file
				const {encryptedData, iv, key} = await encryptFile(asset.uri, encryptionKey)

				// Get pre-signed URL
				const {uploadUrl, fileKey} = await getPreSignedUploadUrl(fileName, asset.mimeType || 'image/jpeg')

				// Update state to uploading
				setUploadStates(prev => ({
					...prev,
					[fileName]: {progress: 0, status: 'uploading'}
				}))

				// Upload encrypted file
				await uploadEncryptedPhoto(encryptedData, uploadUrl, asset.mimeType || 'image/jpeg')

				// Save encryption details to database
				const response = await savePhotoToDB(
					fileKey,
					key,
					iv,
					fileName,
					asset.mimeType || 'image/jpeg',
					dimensions.width,
					dimensions.height
				)

				// Update state to success
				setUploadStates(prev => ({
					...prev,
					[fileName]: {progress: 100, status: 'uploaded'}
				}))

				return response
			} catch (error) {
				const fileName = asset.fileName || `photo_${Date.now()}.jpg`
				setUploadStates(prev => ({
					...prev,
					[fileName]: {
						progress: 0,
						status: 'error',
						error: error instanceof Error ? error.message : 'Upload failed'
					}
				}))

				throw error
			}
		},
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

		filesToProcess.forEach(asset => {
			const fileName = asset.fileName || `photo_${Date.now()}.jpg`
			processingFiles.current.add(fileName)
			uploadFile(asset)
			setUploadStates(prev => ({
				...prev,
				[fileName]: {progress: 0, status: 'idle'}
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

	const selectAndUploadPhotos = useCallback(async () => {
		try {
			// Request permission
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

			if (permissionResult.granted === false) {
				setFileRejections([{fileName: 'Permission', error: 'Permission to access photos is required'}])
				return
			}

			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsMultipleSelection: true,
				quality: 1,
				exif: false
			})

			if (!result.canceled && result.assets) {
				// Add selected images to upload queue
				uploadQueue.current.push(...result.assets)
				processQueue()
			}
		} catch (error) {
			setFileRejections([{
				fileName: 'Selection',
				error: error instanceof Error ? error.message : 'Failed to select photos'
			}])
		}
	}, [processQueue])

	const onProgressHoverChange = useCallback((isHovering: boolean) => {
		setIsHovering(isHovering)
	}, [])

	return {
		uploadStates,
		showProgress,
		setShowProgress,
		selectAndUploadPhotos,
		fileRejections,
		onProgressHoverChange
	}
}
