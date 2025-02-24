'use client'

import {useAllAlbums} from '@/app/api/albums/query'
import {TextShimmer} from '@halycon/ui/components/text-shimmer'
import AlbumCard from '@/components/album-card'

export const AlbumView = () => {
	const {data: albums, isLoading, isError} = useAllAlbums()

	if (isLoading) {
		return <TextShimmer duration={1}>
			Collecting and decrypting . . .
		</TextShimmer>
	}

	if (isError) {
		return <div>Error loading albums</div>
	}

	return (
		<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-3 xl:gap-4">
			{albums && albums.map(album => (
				<AlbumCard key={album.id} album={album} />
			))}
		</div>
	)
}
