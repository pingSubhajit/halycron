import {useMutation, useQueryClient} from '@tanstack/react-query'
import {useCallback, useEffect, useRef, useState} from 'react'
import * as ImagePicker from 'expo-image-picker'
import {Alert} from 'react-native'
import {Photo, UploadState} from '../lib/types'
import {photoQueryKeys} from '../lib/photo-keys'
import {uploadNotificationManager} from '../lib/notification-utils'
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
	uploadSharedPhotos: (assets: ImagePicker.ImagePickerAsset[]) => Promise<void>
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
	const [notificationsInitialized, setNotificationsInitialized] = useState(false)

	// Initialize notifications on first use
	useEffect(() => {
		const initNotifications = async () => {
			const success = await uploadNotificationManager.initialize()
			setNotificationsInitialized(success)
		}
		initNotifications()
	}, [])

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
					[fileName]: {progress: 0, status: 'encrypting', imageUri: asset.uri}
				}))

				// Update notification for encrypting
				if (notificationsInitialized) {
					await uploadNotificationManager.updateFileProgress(fileName, 0, 'encrypting')
				}

				// Encrypt the file
				const {encryptedData, iv, key} = await encryptFile(asset.uri, encryptionKey)

				// Get pre-signed URL
				const {uploadUrl, fileKey} = await getPreSignedUploadUrl(fileName, asset.mimeType || 'image/jpeg')

				// Update state to uploading
				setUploadStates(prev => ({
					...prev,
					[fileName]: {progress: 0, status: 'uploading', imageUri: asset.uri}
				}))

				// Update notification for upload progress
				if (notificationsInitialized) {
					await uploadNotificationManager.updateFileProgress(fileName, 0, 'uploading')
				}

				// Upload encrypted file
				await uploadEncryptedPhoto(encryptedData, uploadUrl, asset.mimeType || 'image/jpeg')

				// Update progress to 90% after upload complete (before DB save)
				setUploadStates(prev => ({
					...prev,
					[fileName]: {progress: 90, status: 'uploading', imageUri: asset.uri}
				}))

				if (notificationsInitialized) {
					await uploadNotificationManager.updateFileProgress(fileName, 90, 'uploading')
				}

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
					[fileName]: {progress: 100, status: 'uploaded', imageUri: asset.uri}
				}))

				// Update notification for completion
				if (notificationsInitialized) {
					await uploadNotificationManager.updateFileProgress(fileName, 100, 'uploaded')
				}

				return response
			} catch (error) {
				const fileName = asset.fileName || `photo_${Date.now()}.jpg`
				const errorMessage = error instanceof Error ? error.message : 'Upload failed'

				setUploadStates(prev => ({
					...prev,
					[fileName]: {
						progress: 0,
						status: 'error',
						error: errorMessage,
						imageUri: asset.uri
					}
				}))

				// Update notification for error
				if (notificationsInitialized) {
					await uploadNotificationManager.updateFileProgress(fileName, 0, 'error')
				}

				// Handle email verification errors specifically
				if (errorMessage.includes('Email verification required') || errorMessage.includes('grandfathered limit')) {
					const isGrandfathered = errorMessage.includes('grandfathered limit')
					const title = isGrandfathered ? 'Photo Limit Reached' : 'Email Verification Required'
					const message = isGrandfathered
						? 'You\'ve reached your grandfathered 50-photo limit. Please verify your email for unlimited uploads.'
						: 'You\'ve reached the 10-photo limit for unverified accounts. Please verify your email to upload more photos.'

					Alert.alert(
						title,
						message,
						[
							{
								text: 'Cancel',
								style: 'cancel'
							},
							{
								text: 'Go to Settings',
								onPress: () => {
									/*
									 * Navigation to settings would go here if needed
									 * For now, just inform the user
									 */
									Alert.alert(
										'Verify Your Email',
										'Please check your email for the verification link, or go to Settings to resend it.',
										[{text: 'OK'}]
									)
								}
							}
						]
					)
				}

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
				[fileName]: {progress: 0, status: 'idle', imageUri: asset.uri}
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

		// Check if all uploads are complete and show completion notification
		const totalFiles = Object.keys(uploadStates).length
		const completedCount = Object.values(uploadStates).filter(
			state => state.status === 'uploaded' || state.status === 'error'
		).length
		const successCount = Object.values(uploadStates).filter(
			state => state.status === 'uploaded'
		).length

		if (totalFiles > 0 && completedCount === totalFiles && notificationsInitialized) {
			// All uploads are complete, show completion notification
			uploadNotificationManager.showUploadCompleted(successCount, totalFiles)
		}
	}, [uploadStates, processQueue, checkAndInvalidateQueries, notificationsInitialized])

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
				// Start upload session with total number of files
				if (notificationsInitialized) {
					await uploadNotificationManager.startUploadSession(result.assets.length)
				}

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
	}, [processQueue, notificationsInitialized])

	const uploadSharedPhotos = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
		try {
			// Start upload session with total number of files
			if (notificationsInitialized) {
				await uploadNotificationManager.startUploadSession(assets.length)
			}

			// Add selected images to upload queue
			uploadQueue.current.push(...assets)
			processQueue()
		} catch (error) {
			setFileRejections([{
				fileName: 'Shared',
				error: error instanceof Error ? error.message : 'Failed to upload shared photos'
			}])
		}
	}, [processQueue, notificationsInitialized])

	const onProgressHoverChange = useCallback((isHovering: boolean) => {
		setIsHovering(isHovering)
	}, [])

	return {
		uploadStates,
		showProgress,
		setShowProgress,
		selectAndUploadPhotos,
		uploadSharedPhotos,
		fileRejections,
		onProgressHoverChange
	}
}
