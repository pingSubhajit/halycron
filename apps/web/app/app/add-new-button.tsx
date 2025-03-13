'use client'

import {AlertCircle, Terminal, Upload} from 'lucide-react'
import {TextScramble} from '@halycron/ui/components/text-scramble'
import {Button} from '@halycron/ui/components/button'
import {useEffect, useState} from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@halycron/ui/components/dialog'
import {useHotkeys} from 'react-hotkeys-hook'
import {Badge} from '@halycron/ui/components/badge'
import {usePhotoUpload} from '@/hooks/use-photo-upload'
import {useDropzone} from 'react-dropzone'
import {ACCEPTED_IMAGE_FORMATS, MAX_IMAGE_SIZE} from '@/lib/constants'
import {toast} from 'sonner'
import {formatFileSize} from '@/components/photo-upload'
import {UploadProgress} from '@/components/upload-progress'
import {cn} from '@halycron/ui/lib/utils'
import {AnimatePresence, motion} from 'motion/react'

export const AddNewButton = () => {
	const [primaryHover, setPrimaryHover] = useState(false)
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

	useHotkeys('u', () => !primaryHover && setIsUploadDialogOpen(true), [primaryHover])

	const {uploadStates, showProgress, onDrop, onProgressHoverChange} = usePhotoUpload()

	const {getRootProps, getInputProps, isDragActive, fileRejections} = useDropzone({
		onDrop,
		accept: ACCEPTED_IMAGE_FORMATS,
		maxSize: MAX_IMAGE_SIZE,
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
				icon: <AlertCircle className="h-5 w-5"/>
			})
		})
	}, [fileRejections])

	return (
		<Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="uppercase w-32 justify-between" onMouseEnter={() => setPrimaryHover(true)}
					onMouseLeave={() => setPrimaryHover(false)}>
					<Upload className="size-4"/>
					<TextScramble
						speed={0.05}
						trigger={primaryHover}
					>
						// Add new
					</TextScramble>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Add some memories to your vault
						<Badge variant="secondary" className="opacity-60">U</Badge>
					</DialogTitle>
					<DialogDescription>
						Drop your photos here or click to browse — they'll be encrypted right on your device
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center border rounded px-4 py-2 gap-2">
					<Terminal className="h-4 w-4"/>
					<p className="opacity-80 text-sm">Your photos are encrypted before they leave your device—only you
						can see them</p>
				</div>

				<div
					{...getRootProps()}
					className={cn(
						'!outline-0 w-full h-80 border border-dashed transition-all duration-200 bg-transparent flex flex-col justify-center items-center p-16',
						isDragActive && 'border-primary/60'
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
							<p className="text-lg">Drop your photos here or tap to browse</p>
							<p className="text-center opacity-60 text-sm">We welcome JPEG, PNG, HEIC, HEIF, AVIF, AVIS,
								WEBP and RAW formats</p>
						</motion.div>}

						{isDragActive && <motion.div
							key="drag-active"
							className="flex flex-col justify-center items-center gap-2"
							initial={{opacity: 0, y: -20}}
							animate={{opacity: 1, y: 0}}
							exit={{opacity: 0, y: -20}}
						>
							<p className="text-lg">Perfect! Now just let go</p>
						</motion.div>}
					</AnimatePresence>
				</div>

				<UploadProgress
					uploadStates={uploadStates}
					showProgress={showProgress}
					hasPortal={false}
					className="w-full max-h-[350px] static p-0"
					onHoverChange={onProgressHoverChange}
				/>
			</DialogContent>
		</Dialog>
	)
}
