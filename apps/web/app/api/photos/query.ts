import {QueryOptions, useQuery} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {api} from '@/lib/data/api-client'
import {Photo} from '@/app/api/photos/types'
import {SetStateAction} from 'react'
import {downloadAndDecryptFile} from '@/app/api/photos/utils'

export const useAllPhotos = (
	setTotal?: (total: number) => void,
	setPhotos?: (value: SetStateAction<Photo[]>) => void,
	setLoaded?: (loaded: number) => void,
	setDimensions?: (value: SetStateAction<{width: number, height: number}[]>) => void,
	options?: QueryOptions<Photo[], Error>
) => {
	return useQuery({
		queryKey: photoQueryKeys.allPhotos(),
		queryFn: async () => {
			setLoaded?.(0)
			setPhotos?.([])

			const response = await api.get<Photo[]>('/api/photos')
			setTotal?.(response.length)

			const photos = []
			setDimensions?.(response.map(photo => ({width: photo.imageWidth || 800, height: photo.imageHeight || 600})))

			for (let i = 0; i < response.length; i++) {
				const photo = response[i]!
				photo.url = await downloadAndDecryptFile(photo.url, photo.encryptedKey, photo.keyIv, photo.mimeType)

				if (setPhotos) {
					setPhotos((prev) => {
						// Check if photo with this ID already exists
						if (prev.some(p => p.id === photo.id)) {
							return prev
						}
						return [...prev, photo]
					})
				}

				setLoaded?.(i + 1)
				photos.push(photo)
			}

			return photos
		},
		...options
	})
}
