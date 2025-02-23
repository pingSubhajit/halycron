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
