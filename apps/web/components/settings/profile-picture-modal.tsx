'use client'

import {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import {AnimatePresence, motion} from 'motion/react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@halycron/ui/components/dialog'
import {Progress} from '@halycron/ui/components/progress'
import {AlertCircle} from 'lucide-react'
import {cn} from '@halycron/ui/lib/utils'
import {useUploadProfilePicture} from '@/app/api/profile/picture/mutations'
import {useUpdateProfile} from '@/app/api/profile/mutations'
import {ProfilePicture} from '../profile-picture'
import {toast} from 'sonner'

interface ProfilePictureModalProps {
	isOpen: boolean
	onClose: () => void
	currentImageUrl?: string | null
	userEmail?: string
	userName?: string
	onUploadSuccess: (imageUrl: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = {
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
	'image/webp': ['.webp']
}

export const ProfilePictureModal = ({
	isOpen,
	onClose,
	currentImageUrl,
	userEmail,
	userName,
	onUploadSuccess
}: ProfilePictureModalProps) => {
	const [uploadProgress, setUploadProgress] = useState(0)
	const [isUploading, setIsUploading] = useState(false)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)

	const uploadProfilePicture = useUploadProfilePicture()
	const updateProfile = useUpdateProfile({
		onSuccess: () => {
			onUploadSuccess('')
			toast.success('Profile picture removed')
			onClose()
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to remove profile picture')
		}
	})

	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		const file = acceptedFiles[0]
		if (!file) return

		// Create preview URL
		const preview = URL.createObjectURL(file)
		setPreviewUrl(preview)
		setIsUploading(true)
		setUploadProgress(0)

		try {
			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setUploadProgress(prev => {
					if (prev >= 90) {
						clearInterval(progressInterval)
						return prev
					}
					return prev + 10
				})
			}, 200)

			const updatedUser = await uploadProfilePicture.mutateAsync(file)

			clearInterval(progressInterval)
			setUploadProgress(100)

			// Clean up preview URL
			URL.revokeObjectURL(preview)
			setPreviewUrl(null)

			onUploadSuccess(updatedUser.image || '')
			toast.success('Profile picture updated successfully!')
			onClose()
		} catch (error) {
			console.error('Profile picture upload failed:', error)
			toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture')

			// Clean up preview URL
			URL.revokeObjectURL(preview)
			setPreviewUrl(null)
		} finally {
			setIsUploading(false)
			setUploadProgress(0)
		}
	}, [uploadProfilePicture, onUploadSuccess, onClose])

	const {getRootProps, getInputProps, isDragActive, fileRejections} = useDropzone({
		onDrop,
		accept: ACCEPTED_FILE_TYPES,
		maxSize: MAX_FILE_SIZE,
		multiple: false,
		disabled: isUploading
	})

	// Handle file rejections
	const hasFileRejections = fileRejections.length > 0
	const rejectionMessages = fileRejections.map(rejection => {
		return rejection.errors.map(error => {
			switch (error.code) {
			case 'file-too-large':
				return 'File is too large. Maximum size is 5MB.'
			case 'file-invalid-type':
				return 'Invalid file type. Please use JPEG, PNG, or WebP.'
			default:
				return error.message
			}
		}).join(', ')
	})

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Update Profile Picture</DialogTitle>
					<DialogDescription>
						Upload a new profile picture or remove your current one.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Upload Area */}
					<div
						{...getRootProps()}
						className={cn(
							'!outline-0 w-full h-44 border border-dashed transition-all duration-200 bg-transparent flex flex-col justify-center items-center p-8',
							isDragActive && 'border-primary/60',
							hasFileRejections && 'border-destructive bg-destructive/5',
							isUploading && 'cursor-not-allowed opacity-50'
						)}
					>
						<input {...getInputProps()} />

						<AnimatePresence mode="wait">
							{!isDragActive && <motion.div
								key="drop-files"
								className="flex flex-col justify-center items-center gap-2"
								initial={{opacity: 0, y: 20}}
								animate={{opacity: 1, y: 0}}
								exit={{opacity: 0, y: 20}}
							>
								<div className="relative">
									<ProfilePicture
										userImage={previewUrl || currentImageUrl}
										userEmail={userEmail}
										userName={userName}
										className="h-24 w-24 border-2 border-border mb-2"
										fallbackClassName="text-xl"
									/>

									{isUploading && (
										<div
											className="absolute inset-0 bg-black/50 rounded-none flex items-center justify-center">
											<div className="text-white text-sm font-medium">
												{uploadProgress}%
											</div>
										</div>
									)}
								</div>

								{/* Upload Progress */}
								{isUploading && (
									<div className="space-y-2">
										<Progress value={uploadProgress} className="h-2"/>
										<p className="text-sm text-muted-foreground text-center">
											Uploading profile picture...
										</p>
									</div>
								)}
								{!isUploading &&
                                    <p className="text-sm text-center">Drop your profile picture here or tap to
	browse</p>}
							</motion.div>}

							{isDragActive && <motion.div
								key="drag-active"
								className="flex flex-col justify-center items-center gap-2"
								initial={{opacity: 0, y: -20}}
								animate={{opacity: 1, y: 0}}
								exit={{opacity: 0, y: -20}}
							>
								<p className="text-sm text-center">Perfect! Now just let go</p>
							</motion.div>}
						</AnimatePresence>
					</div>

					{/* Error Messages */}
					{hasFileRejections && (
						<div
							className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-none">
							<AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"/>
							<div className="text-sm text-destructive">
								{rejectionMessages.join(', ')}
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
