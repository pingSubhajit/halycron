'use client'

import {useAllAlbums} from '@/app/api/albums/query'
import {TextShimmer} from '@halycon/ui/components/text-shimmer'
import AlbumCard from '@/components/album-card'
import {useDeleteAlbum} from '@/app/api/albums/mutations'
import {toast} from 'sonner'
import {useQueryClient} from '@tanstack/react-query'
import {albumQueryKeys} from '@/app/api/albums/keys'
import {Album} from '@/app/api/albums/types'

type DeleteAlbumContext = {
	previousAlbums: Album[] | undefined
}

export const AlbumView = () => {
	const {data: albums, isLoading, isError} = useAllAlbums()
	const queryClient = useQueryClient()

	const {mutate: deleteAlbum} = useDeleteAlbum({
		onMutate: async (albumId: string) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({queryKey: albumQueryKeys.allAlbums()})

			// Snapshot the previous value
			const previousAlbums = queryClient.getQueryData<Album[]>(albumQueryKeys.allAlbums())

			// Optimistically update to the new value
			if (previousAlbums) {
				queryClient.setQueryData<Album[]>(
					albumQueryKeys.allAlbums(),
					previousAlbums.filter(album => album.id !== albumId)
				)
			}

			// Return a context object with the snapshotted value
			return {previousAlbums}
		},
		onError: (error: Error, albumId: string, context: unknown) => {
			// Rollback to the previous value if there's an error
			const ctx = context as DeleteAlbumContext
			if (ctx?.previousAlbums) {
				queryClient.setQueryData(albumQueryKeys.allAlbums(), ctx.previousAlbums)
			}
			toast.error(error.message)
		},
		onSuccess: () => {
			toast.success('Album deleted successfully')
		},
		onSettled: () => {
			// Invalidate and refetch to ensure our optimistic update matches the server state
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
		}
	})

	if (isLoading) {
		return <TextShimmer duration={1}>
			Collecting and decrypting . . .
		</TextShimmer>
	}

	if (isError) {
		return <div>Error loading albums</div>
	}

	return (
		<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-3 xl:gap-4">
			{albums && albums.map(album => (
				<AlbumCard
					key={album.id}
					album={album}
					onDelete={() => deleteAlbum(album.id)}
				/>
			))}
		</div>
	)
}
