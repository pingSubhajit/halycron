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
import {Image as ImageIcon} from 'lucide-react'
import {useLightbox} from './lightbox-context'
import {Switch} from '@halycron/ui/components/switch'
import {Label} from '@halycron/ui/components/label'
import {EyeOff, Lock} from 'lucide-react'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {useEffect, useState} from 'react'

const CreateAlbumForm = ({photoId, variant}: {photoId: string, variant?: 'context-menu' | 'dropdown'}) => {
	const {register, handleSubmit, formState: {errors, isSubmitting}, reset, watch, setValue} = useForm<CreateAlbumInput>({
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
		}
	}, [pin, setValue])

	const onSubmit = async (data: CreateAlbumInput) => {
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
		<form onSubmit={handleSubmit(onSubmit)} className="p-2 flex flex-col gap-3">
			<div className="flex gap-1">
				<Input
					{...register('name')}
					placeholder="Album name"
					className={cn('h-7 text-xs', errors.name && 'border-destructive')}
				/>

				<Button type="submit" variant="secondary" size="sm" disabled={isSubmitting} className="h-7 text-xs">
					Create
				</Button>
			</div>

			{errors.name && (
				<p className="text-xs text-destructive">{errors.name.message}</p>
			)}
            
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<EyeOff className="h-3 w-3 text-muted-foreground" />
						<Label htmlFor="sensitive-toggle" className="text-xs">
							Sensitive Content
						</Label>
					</div>
					<Switch 
						id="sensitive-toggle" 
						{...register('isSensitive')}
						onCheckedChange={(checked) => setValue('isSensitive', checked)}
					/>
				</div>
				
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Lock className="h-3 w-3 text-muted-foreground" />
						<Label htmlFor="protected-toggle" className="text-xs">
							PIN Protection
						</Label>
					</div>
					<Switch 
						id="protected-toggle" 
						{...register('isProtected')}
						onCheckedChange={(checked) => setValue('isProtected', checked)}
					/>
				</div>
			</div>
			
			{isProtected && (
				<div className="mt-1">
					<Label htmlFor="pin-input" className="text-xs mb-1 block">
						Enter 4-digit PIN
					</Label>
					<InputOTP maxLength={4} value={pin} onChange={setPin}>
						<InputOTPGroup className="justify-center">
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
						</InputOTPGroup>
					</InputOTP>
					{errors.pin && (
						<p className="text-xs text-destructive mt-1">{errors.pin.message}</p>
					)}
				</div>
			)}
		</form>
	)
}

interface AlbumSelectorProps {
	photo: Photo
	variant?: 'context-menu' | 'dropdown'
	className?: string
}

export const AlbumSelector = ({photo, variant = 'context-menu', className}: AlbumSelectorProps) => {
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
					<ContextMenuSubContent className="w-64">
						<CreateAlbumForm photoId={photo.id} variant="context-menu" />
						<ContextMenuSeparator />
						{albums?.map(album => (
							<ContextMenuCheckboxItem
								key={album.id}
								checked={photo.albums?.some(a => a.id === album.id)}
								onCheckedChange={(checked) => handleAlbumToggle(album.id, !checked)}
							>
								{album.name}
							</ContextMenuCheckboxItem>
						))}
						{!albums?.length && (
							<div className="px-2 py-1.5 text-sm opacity-50">No albums created yet</div>
						)}
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
						className="hover:border-none"
					>
						<ImageIcon className="h-4 w-4" />
						<span className="sr-only">Manage albums</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-64" align="center">
					<CreateAlbumForm photoId={photo.id} variant="dropdown" />
					<DropdownMenuSeparator />
					{albums?.map(album => (
						<DropdownMenuCheckboxItem
							key={album.id}
							checked={photo.albums?.some(a => a.id === album.id)}
							onCheckedChange={(checked) => handleAlbumToggle(album.id, !checked)}
						>
							{album.name}
						</DropdownMenuCheckboxItem>
					))}
					{!albums?.length && (
						<div className="px-2 py-1.5 text-sm opacity-50">No albums created yet</div>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

export default AlbumSelector
