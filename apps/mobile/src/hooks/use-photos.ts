import {useQuery} from '@tanstack/react-query'
import {Photo} from '../lib/types'
import {api} from '../lib/api-client'
import {photoQueryKeys} from '../lib/photo-keys'

export const useAllPhotos = () => {
	return useQuery({
		queryKey: photoQueryKeys.allPhotos(),
		queryFn: async (): Promise<Photo[]> => {
			return api.get<Photo[]>('/api/photos')
		}
	})
}

export const usePhoto = (photoId: string | undefined) => {
	return useQuery({
		queryKey: photoQueryKeys.photo(photoId || ''),
		queryFn: async (): Promise<Photo> => {
			if (!photoId) throw new Error('Photo ID is required')

			try {
				// Try to fetch the specific photo by ID
				return await api.get<Photo>(`/api/photos/${photoId}`)
			} catch (error) {
				// Fallback: fetch all photos and find the one we need
				const photos = await api.get<Photo[]>('/api/photos')
				const foundPhoto = photos.find(p => p.id === photoId)

				if (!foundPhoto) {
					throw new Error(`Photo with ID ${photoId} not found`)
				}

				return foundPhoto
			}
		},
		enabled: !!photoId
	})
}
