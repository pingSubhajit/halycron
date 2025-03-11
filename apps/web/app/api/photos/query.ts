import {QueryOptions, useQuery} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {api} from '@/lib/data/api-client'
import {Photo} from '@/app/api/photos/types'

export const useAllPhotos = (options?: QueryOptions<Photo[], Error>) => {
	return useQuery({
		queryKey: photoQueryKeys.allPhotos(),
		queryFn: async () => {
			return api.get<Photo[]>('/api/photos')
		},
		...options
	})
}

// Hook to fetch a single photo by ID
export const usePhoto = (photoId: string | undefined, options?: QueryOptions<Photo, Error>) => {
	return useQuery({
		queryKey: photoQueryKeys.photo(photoId || ''),
		queryFn: async () => {
			if (!photoId) throw new Error("Photo ID is required");
			
			// Fetch all photos and find the specific one by ID
			const response = await fetch('/api/photos');
			if (!response.ok) {
				throw new Error('Failed to fetch photos');
			}
			
			const photos = await response.json() as Photo[];
			const foundPhoto = photos.find(p => p.id === photoId);
			
			if (!foundPhoto) {
				throw new Error(`Photo with ID ${photoId} not found`);
			}
			
			return foundPhoto;
		},
		enabled: !!photoId,
		...options
	});
}
