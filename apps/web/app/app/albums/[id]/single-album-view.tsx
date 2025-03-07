'use client'

import {toast} from 'sonner'
import {Photo} from '@/app/api/photos/types'
import {useAlbum, useAlbumPhotos} from '@/app/api/albums/query'
import {useDeletePhoto, useRestorePhoto} from '@/app/api/photos/mutation'
import {useDeleteAlbum, useUpdateAlbum} from '@/app/api/albums/mutations'
import {Album} from '@/app/api/albums/types'
import dynamic from 'next/dynamic'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import {api} from '@/lib/data/api-client'
import {Button} from '@halycron/ui/components/button'
import {Input} from '@halycron/ui/components/input'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Trash2} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'

const Gallery = dynamic(() => import('@/components/gallery').then(mod => mod.Gallery), {ssr: false})

const updateAlbumSchema = z.object({
	name: z.string().min(1, 'Album name is required').trim()
})

type UpdateAlbumFormValues = z.infer<typeof updateAlbumSchema>

interface Props {
	albumId: string
}

const AlbumManager = ({album, onDelete}: {album: Album, onDelete: () => void}) => {
	const [isEditing, setIsEditing] = useState(false)
	const updateAlbum = useUpdateAlbum()

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
			setIsEditing(false)
			toast.success('Album name updated successfully')
		} catch (error) {
			toast.error('Failed to update album name')
		}
	}

	return (
		<div className="flex items-center gap-4 mb-6">
			{isEditing ? (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleUpdate)} className="flex items-center gap-2">
						<FormField
							control={form.control}
							name="name"
							render={({field}) => (
								<FormItem>
									<FormControl>
										<Input
											{...field}
											className="w-64 h-9"
											placeholder="Album name"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" size="sm" disabled={!form.formState.isDirty}>
							Save
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								form.reset()
								setIsEditing(false)
							}}
							size="sm"
						>
							Cancel
						</Button>
					</form>
				</Form>
			) : (
				<div className="flex items-center gap-2 w-full justify-between">
					<h1 className="text-2xl font-semibold" onClick={() => setIsEditing(true)}>{album.name}</h1>

					<Button variant="ghost" size="icon" className="opacity-80" onClick={onDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	)
}

export const SingleAlbumView = ({albumId}: Props) => {
	const router = useRouter()
	const {data: album, isLoading: isLoadingAlbum, isError: isAlbumError} = useAlbum(albumId)
	const {data: photos, isLoading: isLoadingPhotos, isError: isPhotosError} = useAlbumPhotos(albumId)

	const {mutate: restorePhoto} = useRestorePhoto({
		onSuccess: () => {
			toast.success('Photo restored successfully')
		},
		onError: (error) => {
			toast.error(error.message)
		}
	})

	const cleanupS3 = async (s3Key: string) => {
		try {
			await api.post('api/photos/cleanup', {s3Key})
		} catch (error) {
			toast.error(error instanceof Error ? `Failed to cleanup S3: ${error.message}` : 'Failed to cleanup S3')
		}
	}

	const {mutate: deletePhoto} = useDeletePhoto({
		onSuccess: (deletedPhoto) => {
			toast.success('Photo deleted successfully', {
				action: {
					label: 'Undo',
					onClick: () => restorePhoto(deletedPhoto)
				},
				onDismiss: () => {
					// Clean up S3 file after toast is dismissed (user didn't click undo)
					cleanupS3(deletedPhoto.s3Key)
				}
			})
		},
		onError: (error) => {
			toast.error(error.message)
		}
	})

	const onDelete = (photo: Photo) => {
		deletePhoto(photo)
	}

	const {mutate: deleteAlbum} = useDeleteAlbum({
		onSuccess: () => {
			toast.success('Album deleted successfully')
		},
		onError: (error) => {
			toast.error(error.message)
		}
	})

	const handleAlbumDelete = async () => {
		if (!album) return
		deleteAlbum(album.id)
		router.push('/app/albums')
	}

	if (isLoadingAlbum || isLoadingPhotos) {
		return <TextShimmer duration={1}>
			Loading album...
		</TextShimmer>
	}

	if (isAlbumError || isPhotosError || !album || !photos) {
		return <div>Error loading album</div>
	}

	return (
		<div>
			<AlbumManager album={album} onDelete={handleAlbumDelete} />
			<Gallery photos={photos} onDelete={onDelete} />
		</div>
	)
}
