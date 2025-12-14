'use client'

import {useAllAlbums} from '@/app/api/albums/query'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import AlbumCard from '@/components/album-card'
import {useDeleteAlbum} from '@/app/api/albums/mutations'
import {toast} from 'sonner'
import {useQueryClient} from '@tanstack/react-query'
import {albumQueryKeys} from '@/app/api/albums/keys'
import {Album} from '@/app/api/albums/types'
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@halycron/ui/components/empty'
import {FolderOpen} from 'lucide-react'

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
			toast.success('Your album has been removed successfully')
		},
		onSettled: () => {
			// Invalidate and refetch to ensure our optimistic update matches the server state
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
		}
	})

	if (isLoading) {
		return <div className="flex flex-col items-center justify-center h-96">
			<TextShimmer duration={1}>
				Finding your collections...
			</TextShimmer>
		</div>
	}

	if (isError) {
		return <div className="flex flex-col items-center justify-center h-96">
			<p>Hmm, we ran into a hiccup loading your albums. Mind trying again?</p>
		</div>
	}

	if (albums && albums.length === 0) {
		return (
			<Empty className="h-96">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FolderOpen className="h-5 w-5" />
					</EmptyMedia>
					<EmptyTitle>Your albums are empty</EmptyTitle>
					<EmptyDescription>
						Right-click any photo and choose “Add to album” to get started.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
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
