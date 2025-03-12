'use client'

import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAlbum, useAlbumPhotos} from '@/app/api/albums/query'
import {useDeletePhoto, useRestorePhoto} from '@/app/api/photos/mutation'
import {useAddPhotosToAlbum, useDeleteAlbum, useUpdateAlbum} from '@/app/api/albums/mutations'
import {Album} from '@/app/api/albums/types'
import dynamic from 'next/dynamic'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import {api} from '@/lib/data/api-client'
import {Button} from '@halycron/ui/components/button'
import {Input} from '@halycron/ui/components/input'
import {useCallback, useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {EyeOff, Lock, Trash2} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import {PhotoUpload} from '@/components/photo-upload'
import {cn} from '@halycron/ui/lib/utils'
import {PinVerificationDialog} from '@/components/pin-verification-dialog'
import {Switch} from '@halycron/ui/components/switch'
import {Label} from '@halycron/ui/components/label'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {useQueryClient} from '@tanstack/react-query'
import {albumQueryKeys} from '@/app/api/albums/keys'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@halycron/ui/components/tooltip'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

const updateAlbumSchema = z.object({
	name: z.string().min(1, 'Album name is required').trim(),
	isSensitive: z.boolean().optional(),
	isProtected: z.boolean().optional(),
	pin: z.string().length(4).regex(/^\d+$/).optional().or(z.literal(''))
})

type UpdateAlbumFormValues = z.infer<typeof updateAlbumSchema>

interface Props {
	albumId: string
}

interface AlbumManagerProps {album: Album, onDelete: () => void, isAccessDenied: boolean, handleLockAlbum: () => void}

const AlbumManager = ({album, onDelete, isAccessDenied, handleLockAlbum}: AlbumManagerProps) => {
	const [isEditing, setIsEditing] = useState(false)
	const [pin, setPin] = useState('')
	const updateAlbum = useUpdateAlbum()

	const form = useForm<UpdateAlbumFormValues>({
		resolver: zodResolver(updateAlbumSchema),
		defaultValues: {
			name: album.name,
			isSensitive: album.isSensitive,
			isProtected: album.isProtected
		}
	})

	// Handle escape key to cancel editing
	useEffect(() => {
		const handleEscapeKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isEditing) {
				form.reset()
				setPin('')
				setIsEditing(false)
			}
		}

		document.addEventListener('keydown', handleEscapeKey)
		return () => document.removeEventListener('keydown', handleEscapeKey)
	}, [isEditing, form])

	const isProtected = form.watch('isProtected')

	// Update the form value when PIN changes
	useEffect(() => {
		if (!album.isProtected) {
			if (pin.length === 4) {
				form.setValue('pin', pin)
			} else if (pin.length === 0) {
				form.setValue('pin', '')
			}
		}
	}, [pin, form, album.isProtected])

	const handleUpdate = async (values: UpdateAlbumFormValues) => {
		try {
			// Only include fields that are being updated
			const updateData: Partial<Album> & { pin?: string } = {
				id: album.id, // Always need the ID
				name: values.name
			}

			// Only include these fields if they've changed
			if (values.isSensitive !== album.isSensitive) {
				updateData.isSensitive = values.isSensitive
			}

			if (values.isProtected !== album.isProtected) {
				updateData.isProtected = values.isProtected
				// Include PIN only when enabling protection
				if (values.isProtected && values.pin) {
					updateData.pin = values.pin
				}
			}

			await updateAlbum.mutateAsync(updateData as Album)
			setIsEditing(false)
			toast.success('Album updated successfully')
		} catch (error) {
			toast.error('Failed to update album')
		}
	}

	return (
		<div className="flex flex-col gap-4">
			{isEditing ? (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({field}) => (
									<FormItem>
										<FormControl>
											<Input
												{...field}
												className="w-full h-9"
												placeholder="Album name"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex flex-col gap-2 border rounded-md p-3">
								<p className="text-sm font-medium mb-2">Album Security</p>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<EyeOff className="h-4 w-4 text-muted-foreground" />
										<Label htmlFor="sensitive-toggle" className="text-sm">
											Sensitive Content
										</Label>
									</div>
									<FormField
										control={form.control}
										name="isSensitive"
										render={({field}) => (
											<FormItem>
												<FormControl>
													<Switch
														id="sensitive-toggle"
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Lock className="h-4 w-4 text-muted-foreground" />
										<div>
											<Label htmlFor="protected-toggle" className="text-sm">
												PIN Protection
											</Label>
											{album.isProtected && (
												<p className="text-xs text-muted-foreground mt-1">
													PIN cannot be changed once set
												</p>
											)}
										</div>
									</div>
									<FormField
										control={form.control}
										name="isProtected"
										render={({field}) => (
											<FormItem>
												<FormControl>
													<Switch
														id="protected-toggle"
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>

								{isProtected && (
									<div className="mt-2 p-3 border rounded-md">
										<Label htmlFor="pin-input" className="text-sm block">
											{album.isProtected
												? 'PIN is already set and cannot be changed'
												: 'Set 4-digit PIN'}
										</Label>
										{!album.isProtected && (
											<div className="mt-2">
												<InputOTP maxLength={4} value={pin} onChange={setPin}>
													<InputOTPGroup className="justify-center">
														<InputOTPSlot index={0} />
														<InputOTPSlot index={1} />
														<InputOTPSlot index={2} />
														<InputOTPSlot index={3} />
													</InputOTPGroup>
												</InputOTP>
												{form.formState.errors.pin && (
													<p className="text-xs text-destructive mt-1">{form.formState.errors.pin.message}</p>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						<div className="flex gap-2">
							<Button
								type="submit"
								disabled={!form.formState.isDirty || form.formState.isSubmitting}
							>
								{form.formState.isSubmitting ? (
									<p>Saving</p>
								) : (
									<p>Save</p>
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									form.reset()
									setPin('')
									setIsEditing(false)
								}}
								disabled={form.formState.isSubmitting}
							>
								Cancel
							</Button>
						</div>
					</form>
				</Form>
			) : (
				<div className="flex items-center gap-2 w-full justify-between">
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-semibold" onClick={() => setIsEditing(true)}>{album.name}</h1>

						<div className="flex items-center gap-2">
							{album.isSensitive && (
								<div className="flex items-center text-sm text-amber-500">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												<EyeOff className="h-4 w-4" />
											</TooltipTrigger>
											<TooltipContent>
												<p>This album contains sensitive content</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							)}
							{album && album.isProtected && !isAccessDenied && (
								<div className="flex items-center gap-1 text-sm text-amber-500">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												<Lock className="h-4 w-4" />
											</TooltipTrigger>
											<TooltipContent>
												<p>This album is protected with a PIN.</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<Button
										variant="outline"
										size="sm"
										onClick={handleLockAlbum}
										className="ml-2 h-7 px-2 text-xs"
									>
										Lock Album
									</Button>
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" className="opacity-80" onClick={onDelete}>
							<Trash2 className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
							Edit
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

export const SingleAlbumView = ({albumId}: Props) => {
	const router = useRouter()
	const queryClient = useQueryClient()
	const {data: album, isLoading: albumLoading, isError: albumError} = useAlbum(albumId)
	const {data: photos, isLoading: photosLoading, isError: photosError, refetch: refetchPhotos} = useAlbumPhotos(albumId, {}, false)

	const deletePhoto = useDeletePhoto()
	const restorePhoto = useRestorePhoto()
	const deleteAlbum = useDeleteAlbum()
	const addPhotosToAlbum = useAddPhotosToAlbum()
	const [isDragging, setIsDragging] = useState(false)
	const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false)
	const [isAccessDenied, setIsAccessDenied] = useState(false)
	const [isProtected, setIsProtected] = useState(false)
	// Flag to track if we should fetch photos
	const [shouldFetchPhotos, setShouldFetchPhotos] = useState(false)

	// Create a memoized handler for PIN verification using useCallback
	const handlePinVerified = useCallback(() => {
		setIsAccessDenied(false)
		setShouldFetchPhotos(true) // Enable photo fetching after PIN verification

		// Use a small delay to ensure the pin dialog is fully closed
		setTimeout(() => {
			// Invalidate both album and photos queries
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})

			// Explicitly fetch photos after PIN verification
			refetchPhotos().catch(error => {
				toast.error('Could not load photos. Please try again.')
			})
		}, 200)
	}, [albumId, queryClient, refetchPhotos])

	useEffect(() => {
		if (album) {
			// Check if the album is protected and requires PIN
			if (album.isProtected && (album as any).requiresPin) {
				setIsAccessDenied(true)
				setIsPinVerificationOpen(true)
				setShouldFetchPhotos(false) // Disable photo fetching for protected albums
			} else {
				setIsProtected(album.isProtected)
				setIsAccessDenied(false) // Clear access denied state for non-protected albums
				setShouldFetchPhotos(true) // Enable photo fetching for non-protected albums

				/*
				 * For non-protected albums or already unlocked protected albums,
				 * trigger fetching photos immediately
				 */
				refetchPhotos().catch((error: any) => {
					// If we get a 403 error requiring PIN, show the PIN dialog
					if (error.response?.status === 403 && error.response?.data?.requiresPin) {
						setIsAccessDenied(true)
						setIsPinVerificationOpen(true)
						setShouldFetchPhotos(false)
					}
				})
			}
		}
	}, [album, refetchPhotos])

	// Enable pointer events when dragging starts anywhere in the window
	useEffect(() => {
		const handleDragEnter = (e: DragEvent) => {
			if (e.dataTransfer?.types.includes('Files')) {
				setIsDragging(true)
			}
		}

		const handleDragLeave = (e: DragEvent) => {
			// Only consider it a leave if we're leaving the window
			if (e.relatedTarget === null) {
				setIsDragging(false)
			}
		}

		const handleDrop = () => {
			setIsDragging(false)
		}

		window.addEventListener('dragenter', handleDragEnter)
		window.addEventListener('dragleave', handleDragLeave)
		window.addEventListener('drop', handleDrop)

		return () => {
			window.removeEventListener('dragenter', handleDragEnter)
			window.removeEventListener('dragleave', handleDragLeave)
			window.removeEventListener('drop', handleDrop)
		}
	}, [])

	const onDelete = (photo: Photo) => {
		deletePhoto.mutate(photo)
	}

	const handleAlbumDelete = async () => {
		if (!album) return
		deleteAlbum.mutate(album.id)
		router.push('/app/albums')
	}

	// Add a function to lock the album by clearing the verification
	const handleLockAlbum = useCallback(async () => {
		try {
			// Call an API endpoint to clear the verification cookie
			await api.post(`/api/albums/${albumId}/lock`)

			// Set states to show PIN dialog
			setIsAccessDenied(true)
			setIsPinVerificationOpen(true)

			window.location.reload()
		} catch (error) {
			toast.error('Failed to lock album')
		}
	}, [albumId, queryClient])

	if (albumLoading) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-muted-foreground">
					<TextShimmer>Loading album...</TextShimmer>
				</div>
			</div>
		)
	}

	if (albumError || !album) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<p className="text-destructive">Error loading album</p>
			</div>
		)
	}

	if (isAccessDenied && isProtected) {
		return (
			<div className="w-full h-full">
				<div className="flex items-center gap-4 mb-6">
					<h1 className="text-xl font-semibold">{album.name}</h1>
					<div className="flex items-center gap-2">
						<Lock className="h-4 w-4 text-amber-500" />
						<span className="text-sm text-muted-foreground">Protected Album</span>
					</div>
				</div>

				<div className="w-full h-[50vh] flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12">
					<Lock className="h-12 w-12 text-muted-foreground/50" />
					<h3 className="text-xl font-medium">This album is protected</h3>
					<p className="text-muted-foreground text-center max-w-md">
						You need to enter the PIN code to view the contents of this album.
					</p>
					<Button onClick={() => setIsPinVerificationOpen(true)}>Enter PIN</Button>
				</div>

				<PinVerificationDialog
					albumId={albumId}
					isOpen={isPinVerificationOpen}
					onClose={() => setIsPinVerificationOpen(false)}
					onVerified={handlePinVerified}
				/>
			</div>
		)
	}

	return (
		<div className="w-full h-full">
			<div className="w-full h-full">
				<div className="flex flex-col gap-1 mb-4">
					<AlbumManager
						album={album}
						onDelete={handleAlbumDelete}
						isAccessDenied={isAccessDenied}
						handleLockAlbum={handleLockAlbum}
					/>
				</div>

				{photosLoading ? (
					<div className="w-full h-[50vh] flex items-center justify-center">
						<div className="text-muted-foreground">
							<TextShimmer>Loading photos...</TextShimmer>
						</div>
					</div>
				) : photosError ? (
					<div className="w-full h-[50vh] flex items-center justify-center">
						<p className="text-destructive">Error loading photos</p>
					</div>
				) : Array.isArray(photos) && photos.length > 0 ? (
					<Gallery photos={photos} onDelete={onDelete} />
				) : (
					<div className="w-full h-[50vh] flex items-center justify-center rounded-lg border border-dashed p-12">
						<p className="text-muted-foreground">No photos in this album yet</p>
					</div>
				)}
			</div>

			{/* Overlay Drop Zone */}
			<div className={cn(
				'z-50 fixed w-screen h-screen top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
				isDragging ? 'pointer-events-auto' : 'pointer-events-none'
			)}>
				<PhotoUpload onPhotoUploaded={(uploadedPhoto) => {
					// Add the uploaded photo to the album
					if (album) {
						addPhotosToAlbum.mutate({
							albumId: album.id,
							photoIds: [uploadedPhoto.id]
						})
					}
				}} />
			</div>

			{/* PIN Verification Dialog */}
			<PinVerificationDialog
				albumId={albumId}
				isOpen={isPinVerificationOpen}
				onClose={() => setIsPinVerificationOpen(false)}
				onVerified={handlePinVerified}
			/>
		</div>
	)
}
