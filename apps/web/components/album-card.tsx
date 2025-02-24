'use client'

import {Album} from '@/app/api/albums/types'
import {useAlbumPhotos} from '@/app/api/albums/query'
import {Photo} from '@/app/api/photos/types'
import {useDecryptedUrl} from '@/hooks/use-decrypted-url'
import Image from 'next/image'

const PhotoLayer = ({photo}: {photo: Photo}) => {
	const decryptedUrl = useDecryptedUrl(photo)

	if (!decryptedUrl) {
		return <div className="relative overflow-hidden bg-accent animate-pulse w-full h-full min-h-48" />
	}

	return (
		<div>
			<Image
				src={decryptedUrl}
				alt={photo.originalFilename}
				width={photo.imageWidth || 800}
				height={photo.imageHeight || 600}
				className="w-full h-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
			/>
		</div>
	)
}

export const AlbumCard = ({album}: {album: Album}) => {
	const {data: photos, isLoading, isError} = useAlbumPhotos(album.id)

	if (isLoading) {
		return <div className="relative overflow-hidden bg-accent animate-pulse w-full h-full min-h-48" />
	}

	return (
		<div>
			{photos && photos[0] && <PhotoLayer photo={photos[0]} />}
		</div>
	)
}

export default AlbumCard
