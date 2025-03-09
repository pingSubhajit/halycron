'use client'

import {Album} from '@/app/api/albums/types'
import {useAlbumPhotos} from '@/app/api/albums/query'
import {Photo} from '@/app/api/photos/types'
import {useDecryptedUrl} from '@/hooks/use-decrypted-url'
import Image from 'next/image'
import {Image as ImageIcon, Trash2, AlertCircle} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '@halycron/ui/components/context-menu'
import {format} from 'date-fns'
import {useUpdateAlbum, useAddPhotosToAlbum} from '@/app/api/albums/mutations'
import {toast} from 'sonner'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import {Input} from '@halycron/ui/components/input'
import {useDebounce} from '@/hooks/use-debounce'
import {useDropzone} from 'react-dropzone'
import {cn} from '@halycron/ui/lib/utils'
import {usePhotoUpload} from '@/hooks/use-photo-upload'
import {AnimatePresence} from 'framer-motion'
import {motion} from 'framer-motion'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import {ACCEPTED_IMAGE_FORMATS, MAX_IMAGE_SIZE} from '@/lib/constants'
import {FileRejection} from 'react-dropzone'
import {Portal} from '@radix-ui/react-portal'
import {UploadProgress} from './upload-progress'

const PhotoLayer = ({
	photo,
	style,
	zIndex,
	isTop,
	isStack,
	isAnimating
}: {
	photo: Photo
	style?: React.CSSProperties
	zIndex: number
	isTop: boolean
	isStack: boolean
	isAnimating: boolean
}) => {
	const decryptedUrl = useDecryptedUrl(photo)

	if (!decryptedUrl) {
		return <></>
	}

	const getTransform = () => {
		const rotation = style?.transform || 'rotate(0deg)'
		const translateY = isStack && isAnimating ? '-16px' : '0'
		const translateX = isTop && isAnimating ? '120%' : '0'
		return `${rotation} translateY(${translateY}) translateX(${translateX})`
	}

	// Calculate dimensions to maintain aspect ratio while fitting container
	const aspectRatio = (photo.imageWidth || 4) / (photo.imageHeight || 3)
	const containerAspectRatio = 4 / 3 // matches the parent container's aspect ratio

	// Calculate the scale factor to fit the image within 90% of the container
	const scale = aspectRatio > containerAspectRatio
		? '90%' // width-constrained
		: '90%' // height-constrained

	return (
		<div
			style={{
				...style,
				zIndex,
				transform: getTransform(),
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
			}}
			className="absolute inset-0 flex items-center justify-center"
		>
			<div
				className="relative w-full h-full flex items-center justify-center"
				style={{
					maxWidth: scale,
					maxHeight: scale
				}}
			>
				<Image
					src={decryptedUrl}
					alt={photo.originalFilename}
					width={photo.imageWidth || 800}
					height={photo.imageHeight || 600}
					className="rounded-lg shadow-lg object-contain"
					style={{
						maxWidth: '100%',
						maxHeight: '100%',
						width: 'auto',
						height: 'auto'
					}}
				/>
			</div>
		</div>
	)
}

const updateAlbumSchema = z.object({
	name: z.string().min(1, 'Album name is required').trim()
})

type UpdateAlbumFormValues = z.infer<typeof updateAlbumSchema>

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const AlbumCard = ({album, onDelete}: {album: Album, onDelete: () => void}) => {
	const {data: photos, isLoading, isError} = useAlbumPhotos(album.id)
	const [topPhotoIndex, setTopPhotoIndex] = useState(0)
	const [isAnimating, setIsAnimating] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
	const rotationsRef = useRef<{ [key: number]: number }>({})
	const updateAlbum = useUpdateAlbum()
	const containerRef = useRef<HTMLDivElement>(null)

	const {mutate: addPhotosToAlbum} = useAddPhotosToAlbum(undefined, {
		onError: (error) => {
			toast.error(error.message)
		},
		onSuccess: () => {
			toast.success('Photo added to album')
		}
	})

	const {uploadStates, showProgress, onDrop, fileRejections, onProgressHoverChange} = usePhotoUpload({
		onPhotoUploaded: (photo) => {
			addPhotosToAlbum({
				albumId: album.id,
				photoIds: [photo.id]
			})
		}
	})

	const {getRootProps, getInputProps, isDragActive} = useDropzone({
		onDrop: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => onDrop(acceptedFiles, rejectedFiles),
		accept: ACCEPTED_IMAGE_FORMATS,
		maxSize: MAX_IMAGE_SIZE,
		noClick: true // Disable click to open file dialog
	})

	const form = useForm<UpdateAlbumFormValues>({
		resolver: zodResolver(updateAlbumSchema),
		defaultValues: {
			name: album.name
		}
	})

	const handleUpdate = async (values: UpdateAlbumFormValues) => {
		try {
			await updateAlbum.mutateAsync({
				...album,
				name: values.name,
				updatedAt: new Date()
			})
			toast.success('Album name updated successfully')
		} catch (error) {
			toast.error('Failed to update album name')
			form.reset()
		}
	}

	const debouncedUpdate = useDebounce(handleUpdate, 500)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsEditing(false)
				form.reset()
			}
		}

		if (isEditing) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isEditing, form])

	// Subscribe to form changes and trigger debounced update
	useEffect(() => {
		const subscription = form.watch((value, {name}) => {
			if (name === 'name' && form.formState.isValid) {
				debouncedUpdate(value as UpdateAlbumFormValues)
			}
		})
		return () => subscription.unsubscribe()
	}, [form, debouncedUpdate])

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

	const hasMultiplePhotos = photos && photos.length > 1

	const getRandomRotation = (index: number) => {
		if (rotationsRef.current[index] === undefined) {
			rotationsRef.current[index] = Math.random() * 10 - 5
		}
		return `rotate(${rotationsRef.current[index]}deg)`
	}

	const rotatePhotos = useCallback(() => {
		if (!hasMultiplePhotos) return

		setIsAnimating(true)

		setTimeout(() => {
			setTopPhotoIndex(current => (current + 1) % photos.length)
			setTimeout(() => {
				setIsAnimating(false)
			}, 50)
		}, 150)
	}, [hasMultiplePhotos, photos?.length])

	const startPhotoRotation = useCallback(() => {
		if (!hasMultiplePhotos) return

		rotatePhotos()
		hoverTimerRef.current = setInterval(rotatePhotos, 1000)
	}, [hasMultiplePhotos, rotatePhotos])

	const stopPhotoRotation = useCallback(() => {
		if (hoverTimerRef.current) {
			clearInterval(hoverTimerRef.current)
			hoverTimerRef.current = null
		}
		setIsAnimating(false)
	}, [])

	if (isLoading) {
		return <div className="relative overflow-hidden bg-accent animate-pulse w-full h-full aspect-[4/3]" />
	}

	return (
		<ContextMenu>
			<Link href={`/app/albums/${album.id}`}>
				<ContextMenuTrigger>
					<div className="w-full cursor-pointer relative" {...getRootProps()}>
						<input {...getInputProps()} />

						{/* Upload Progress */}
						<UploadProgress
							uploadStates={uploadStates}
							showProgress={showProgress}
							className="w-80 max-h-[250px]"
							onHoverChange={onProgressHoverChange}
						/>

						<div
							className={cn(
								'relative w-full aspect-[4/3] overflow-hidden transition-all duration-200',
								isDragActive && 'ring-2 ring-primary ring-offset-2 backdrop-blur-sm'
							)}
							onMouseEnter={startPhotoRotation}
							onMouseLeave={stopPhotoRotation}
						>
							{!album.isSensitive && !album.isProtected && photos && photos[0] && photos.map((photo, index) => {
								const effectiveIndex = (index - topPhotoIndex + photos.length) % photos.length
								const isTop = effectiveIndex === 0
								const isStack = effectiveIndex > 0

								return (
									<PhotoLayer
										key={photo.id}
										photo={photo}
										zIndex={photos.length - effectiveIndex}
										isTop={isTop}
										isStack={isStack}
										isAnimating={isAnimating}
										style={{
											transform: getRandomRotation(index)
										}}
									/>
								)
							})}

							{photos && photos.length === 0 && <div>
								<div className="absolute inset-0 flex items-center justify-center p-4">
									<ImageIcon className="w-36 h-36 text-muted-foreground opacity-80"/>
								</div>
							</div>}

							{/* Drag overlay */}
							{isDragActive && (
								<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm" />
							)}
						</div>

						{isEditing ? (
							<div ref={containerRef} className="mt-2" onClick={(e) => e.preventDefault()}>
								<Form {...form}>
									<form className="flex items-center justify-center">
										<FormField
											control={form.control}
											name="name"
											render={({field}) => (
												<FormItem>
													<FormControl>
														<Input
															{...field}
															className="h-8 text-center"
															placeholder="Album name"
															autoFocus
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</form>
								</Form>
							</div>
						) : (
							<div className="flex items-center justify-center gap-2 mt-2">
								<p className="text-center font-semibold text-muted-foreground">{album.name}</p>
								<span className="py-0.5 w-5 text-center rounded-full bg-muted text-xs aspect-square">
									{photos?.length || 0}
								</span>
							</div>
						)}
					</div>
				</ContextMenuTrigger>
			</Link>
			<ContextMenuContent className="w-56">
				<div className="p-2">
					<div className="flex items-center justify-between gap-2">
						<p>{album.name}</p>
						<p className="py-0.5 w-5 text-center rounded-full bg-primary text-neutral-950 text-xs aspect-square">{photos?.length || 0}</p>
					</div>
					<p className="text-xs opacity-80">Created on: {format(album.createdAt || new Date(), 'MMM dd, yyyy')}</p>
				</div>

				<ContextMenuSeparator />

				<Link href={`/app/albums/${album.id}`}>
					<ContextMenuItem className="flex items-center justify-between">
						<span>View album</span>
						<ImageIcon className="h-4 w-4" />
					</ContextMenuItem>
				</Link>

				<ContextMenuItem
					className="flex items-center justify-between"
					onSelect={(e) => {
						e.preventDefault()
						onDelete()
					}}
				>
					<span>Delete album</span>
					<Trash2 className="h-4 w-4" />
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

export default AlbumCard
