import {Photo} from '@/app/api/photos/types'
import {useAllAlbums} from '@/app/api/albums/query'
import {useAddPhotosToAlbum, useCreateAlbum, useRemovePhotosFromAlbum} from '@/app/api/albums/mutations'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {albumQueryKeys} from '@/app/api/albums/keys'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {CreateAlbumInput, createAlbumSchema} from '@/app/api/albums/types'
import {Button} from '@halycron/ui/components/button'
import {Input} from '@halycron/ui/components/input'
import {cn} from '@halycron/ui/lib/utils'
import {
	ContextMenuCheckboxItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger
} from '@halycron/ui/components/context-menu'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@halycron/ui/components/dropdown-menu'
import {CircleHelp, EyeOff, Image as ImageIcon, Lock} from 'lucide-react'
import {useLightbox} from './lightbox-context'
import {Switch} from '@halycron/ui/components/switch'
import {Label} from '@halycron/ui/components/label'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {useEffect, useState} from 'react'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@halycron/ui/components/tooltip'

const CreateAlbumForm = ({photoId, variant, currentAlbumId}: {
    photoId: string,
    variant?: 'context-menu' | 'dropdown',
    currentAlbumId?: string
}) => {
	const {register, handleSubmit, formState: {errors, isSubmitting}, reset, watch, setValue, setError} = useForm<CreateAlbumInput>({
		resolver: zodResolver(createAlbumSchema),
		defaultValues: {
			name: '',
			isSensitive: false,
			isProtected: false
		}
	})
	const createAlbum = useCreateAlbum()
	const addToAlbum = useAddPhotosToAlbum()
	const queryClient = useQueryClient()
	const {updateCurrentPhoto} = useLightbox()
	const isProtected = watch('isProtected')
	const [pin, setPin] = useState('')

	// Update the form value when PIN changes
	useEffect(() => {
		if (pin.length === 4) {
			setValue('pin', pin)
		} else {
			setValue('pin', undefined)
			// If isProtected is true and pin is not valid, set error
			if (isProtected && pin.length !== 4) {
				setError('pin', {
					type: 'manual',
					message: 'PIN is required when album is protected'
				})
			}
		}
	}, [pin, setValue, isProtected, setError])

	const onSubmit = async (data: CreateAlbumInput) => {
		// Additional validation to ensure PIN is provided when isProtected is true
		if (data.isProtected && !data.pin) {
			setError('pin', {
				type: 'manual',
				message: 'PIN is required when album is protected'
			})
			return
		}

		try {
			// Get the current photos from the cache
			const previousPhotos = queryClient.getQueryData<Photo[]>(photoQueryKeys.allPhotos()) || []

			// Create the album
			const album = await createAlbum.mutateAsync(data)

			// Find the current photo in the cache
			const currentPhoto = previousPhotos.find(p => p.id === photoId)
			if (!currentPhoto) return

			// Create updated photo object
			const updatedPhoto = {
				...currentPhoto,
				albums: [...(currentPhoto.albums || []), {id: album.id, name: album.name}]
			}

			// Update the lightbox's current photo if we're in dropdown mode
			if (variant === 'dropdown') {
				updateCurrentPhoto(updatedPhoto)
			}

			// Optimistically update the cache
			queryClient.setQueryData<Photo[]>(photoQueryKeys.allPhotos(), previousPhotos.map(p => {
				if (p.id === photoId) {
					return updatedPhoto
				}
				return p
			}))

			// Add the current photo to the newly created album
			await addToAlbum.mutateAsync({albumId: album.id, photoIds: [photoId]})

			/*
			 * If the album is sensitive, invalidate the photos query to update the gallery
			 * This ensures photos added to sensitive albums are removed from the gallery view
			 */
			if (data.isSensitive) {
				await queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
			}

			/*
			 * If we're in an album view (currentAlbumId is provided), invalidate the album photos query
			 * This ensures the album view is updated when a photo's albums are modified
			 */
			if (currentAlbumId) {
				await queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(currentAlbumId)})
			}

			reset()
			setPin('')
		} catch (error) {
			// If anything fails, invalidate both queries to get the correct state
			await Promise.all([
				queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()}),
				queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
			])
			// If we're in dropdown mode, get the current photo again to revert changes
			if (variant === 'dropdown') {
				const photos = queryClient.getQueryData<Photo[]>(photoQueryKeys.allPhotos()) || []
				const currentPhoto = photos.find(p => p.id === photoId)
				if (currentPhoto) {
					updateCurrentPhoto(currentPhoto)
				}
			}
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 p-1">
			<div className="space-y-2">
				<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Create New Album</h4>
				<div className="flex gap-2">
					<Input
						{...register('name')}
						placeholder="Name"
						className={cn('h-8 text-xs', errors.name && 'border-destructive')}
					/>

					<Button type="submit" size="sm" disabled={isSubmitting} className="h-8 px-3 text-xs font-semibold">
						Create
					</Button>
				</div>
			</div>

			{errors.name && (
				<p className="text-xs text-destructive font-medium -mt-1">{errors.name.message}</p>
			)}

			<div className="space-y-2 rounded-md border p-2 bg-muted/20">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
						<Label htmlFor="sensitive-toggle" className="text-xs font-medium cursor-pointer">
							Sensitive
						</Label>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<CircleHelp className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
								</TooltipTrigger>
								<TooltipContent side="right" className="max-w-[200px] text-xs">
									<p>Photos in sensitive albums are hidden from the main gallery view.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<Switch
						id="sensitive-toggle"
						className="scale-75 origin-right"
						{...register('isSensitive')}
						onCheckedChange={(checked) => setValue('isSensitive', checked)}
					/>
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Lock className="h-3.5 w-3.5 text-muted-foreground" />
						<Label htmlFor="protected-toggle" className="text-xs font-medium cursor-pointer">
							Protected
						</Label>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<CircleHelp className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
								</TooltipTrigger>
								<TooltipContent side="right" className="max-w-[200px] text-xs">
									<p>Require a 4-digit PIN to access this album.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<Switch
						id="protected-toggle"
						className="scale-75 origin-right"
						{...register('isProtected')}
						onCheckedChange={(checked) => setValue('isProtected', checked)}
					/>
				</div>
			</div>

			{isProtected && (
				<div className="animate-in slide-in-from-top-2 fade-in duration-200">
					<Label htmlFor="pin-input" className="text-xs font-medium mb-1.5 block text-center text-muted-foreground">
						Set 4-digit PIN
					</Label>
					<InputOTP maxLength={4} value={pin} onChange={setPin}>
						<InputOTPGroup className="justify-center w-full gap-2">
							<InputOTPSlot index={0} className="w-9 h-9 text-sm" />
							<InputOTPSlot index={1} className="w-9 h-9 text-sm" />
							<InputOTPSlot index={2} className="w-9 h-9 text-sm" />
							<InputOTPSlot index={3} className="w-9 h-9 text-sm" />
						</InputOTPGroup>
					</InputOTP>
				</div>
			)}
		</form>
	)
}

interface AlbumSelectorProps {
	photo: Photo
	variant?: 'context-menu' | 'dropdown'
	className?: string
    currentAlbumId?: string
}

export const AlbumSelector = ({photo, variant = 'context-menu', className, currentAlbumId}: AlbumSelectorProps) => {
	const {data: albums} = useAllAlbums()
	const addToAlbum = useAddPhotosToAlbum(photo.albums?.map(album => album.id))
	const removeFromAlbum = useRemovePhotosFromAlbum(photo.albums?.map(album => album.id))
	const queryClient = useQueryClient()
	const {updateCurrentPhoto} = useLightbox()

	const handleAlbumToggle = async (albumId: string, isInAlbum: boolean) => {
		// Get the current photos from the cache
		const previousPhotos = queryClient.getQueryData<Photo[]>(photoQueryKeys.allPhotos()) || []
		const targetAlbum = albums?.find(a => a.id === albumId)

		if (!targetAlbum) return

		// Create updated photo object
		const updatedPhoto = {
			...photo,
			albums: isInAlbum
				? (photo.albums || []).filter(a => a.id !== albumId)
				: [...(photo.albums || []), {id: albumId, name: targetAlbum.name}]
		}

		// Update the lightbox's current photo if we're in dropdown mode
		if (variant === 'dropdown') {
			updateCurrentPhoto(updatedPhoto)
		}

		// Optimistically update the cache
		queryClient.setQueryData<Photo[]>(photoQueryKeys.allPhotos(), previousPhotos.map(p => {
			if (p.id === photo.id) {
				return updatedPhoto
			}
			return p
		}))

		try {
			if (isInAlbum) {
				await removeFromAlbum.mutateAsync({albumId, photoIds: [photo.id]})
			} else {
				await addToAlbum.mutateAsync({albumId, photoIds: [photo.id]})

				/*
				 * If the album is sensitive, invalidate the photos query to update the gallery
				 * This ensures photos added to sensitive albums are removed from the gallery view
				 */
				if (targetAlbum.isSensitive) {
					await queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
				}
			}

			/*
			 * If we're in an album view (currentAlbumId is provided), invalidate the album photos query
			 * This ensures the album view is updated when a photo's albums are modified
			 */
			if (currentAlbumId) {
				await queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(currentAlbumId)})
			}
		} catch (error) {
			// If the mutation fails, revert to the previous state
			queryClient.setQueryData(photoQueryKeys.allPhotos(), previousPhotos)
			if (variant === 'dropdown') {
				updateCurrentPhoto(photo) // Revert the lightbox photo as well
			}
			// You might want to show an error toast here
		}
	}

	if (variant === 'context-menu') {
		return (
			<>
				<ContextMenuSub>
					<ContextMenuSubTrigger>Add to album</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-72 p-0">
						<div className="p-3 border-b bg-muted/30">
							<CreateAlbumForm photoId={photo.id} variant="context-menu" currentAlbumId={currentAlbumId}/>
						</div>
						
						<div className="py-1">
							<div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Existing Albums
							</div>
							
							<div className="max-h-[200px] overflow-y-auto custom-scrollbar">
								{albums?.map(album => (
									<ContextMenuCheckboxItem
										key={album.id}
										checked={photo.albums?.some(a => a.id === album.id)}
										onCheckedChange={(checked) => handleAlbumToggle(album.id, !checked)}
										className="pl-8"
									>
										<div className="flex items-center justify-between w-full">
											<span className="truncate max-w-[160px]">{album.name}</span>
											<div className="flex gap-1.5 ml-2">
												{album.isSensitive && <EyeOff className="w-3 h-3 text-amber-500/70" />}
												{album.isProtected && <Lock className="w-3 h-3 text-primary/70" />}
											</div>
										</div>
									</ContextMenuCheckboxItem>
								))}
								{!albums?.length && (
									<div className="px-8 py-4 text-xs text-center text-muted-foreground italic">
										No albums yet. Create one above!
									</div>
								)}
							</div>
						</div>
					</ContextMenuSubContent>
				</ContextMenuSub>
			</>
		)
	}

	return (
		<div className={cn('relative', className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="hover:bg-accent/50 data-[state=open]:bg-accent"
					>
						<ImageIcon className="h-4 w-4" />
						<span className="sr-only">Manage albums</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-72 p-0" align="end">
					<div className="p-3 border-b bg-muted/30">
						<CreateAlbumForm photoId={photo.id} variant="dropdown" currentAlbumId={currentAlbumId}/>
					</div>
					
					<div className="py-1">
						<div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Existing Albums
						</div>
						
						<div className="max-h-[200px] overflow-y-auto custom-scrollbar">
							{albums?.map(album => (
								<DropdownMenuCheckboxItem
									key={album.id}
									checked={photo.albums?.some(a => a.id === album.id)}
									onCheckedChange={(checked) => handleAlbumToggle(album.id, !checked)}
									className="pl-8 cursor-pointer"
								>
									<div className="flex items-center justify-between w-full">
										<span className="truncate max-w-[160px]">{album.name}</span>
										<div className="flex gap-1.5 ml-2">
											{album.isSensitive && <EyeOff className="w-3 h-3 text-amber-500/70" />}
											{album.isProtected && <Lock className="w-3 h-3 text-primary/70" />}
										</div>
									</div>
								</DropdownMenuCheckboxItem>
							))}
							{!albums?.length && (
								<div className="px-8 py-4 text-xs text-center text-muted-foreground italic">
									No albums yet. Create one above!
								</div>
							)}
						</div>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

export default AlbumSelector
