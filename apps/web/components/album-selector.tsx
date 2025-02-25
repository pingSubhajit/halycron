import {Photo} from '@/app/api/photos/types'
import {useAllAlbums} from '@/app/api/albums/query'
import {useAddPhotosToAlbum, useCreateAlbum, useRemovePhotosFromAlbum} from '@/app/api/albums/mutations'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {albumQueryKeys} from '@/app/api/albums/keys'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {CreateAlbumInput, createAlbumSchema} from '@/app/api/albums/types'
import {Button} from '@halycon/ui/components/button'
import {Input} from '@halycon/ui/components/input'
import {cn} from '@halycon/ui/lib/utils'
import {
	ContextMenuCheckboxItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger
} from '@halycon/ui/components/context-menu'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@halycon/ui/components/dropdown-menu'
import {Image as ImageIcon} from 'lucide-react'
import {useLightbox} from './lightbox-context'

const CreateAlbumForm = ({photoId, variant}: {photoId: string, variant?: 'context-menu' | 'dropdown'}) => {
	const {register, handleSubmit, formState: {errors, isSubmitting}, reset} = useForm<CreateAlbumInput>({
		resolver: zodResolver(createAlbumSchema)
	})
	const createAlbum = useCreateAlbum()
	const addToAlbum = useAddPhotosToAlbum()
	const queryClient = useQueryClient()
	const {updateCurrentPhoto} = useLightbox()

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
		<form onSubmit={handleSubmit(onSubmit)} className="p-2 flex flex-col gap-2">
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
