import {QueryOptions, useQuery} from '@tanstack/react-query'
import {albumQueryKeys} from './keys'
import {api} from '@/lib/data/api-client'
import {Album} from './types'
import {Photo} from '../photos/types'

export const useAllAlbums = (options?: QueryOptions<Album[], Error>) => {
	return useQuery({
		queryKey: albumQueryKeys.allAlbums(),
		queryFn: async () => {
			return api.get<Album[]>('/api/albums')
		},
		...options
	})
}

export const useAlbum = (id: string, options?: QueryOptions<Album, Error>) => {
	return useQuery({
		queryKey: albumQueryKeys.album(id),
		queryFn: async () => {
			return api.get<Album>(`/api/albums/${id}`)
		},
		...options
	})
}

export const useAlbumPhotos = (id: string, options?: QueryOptions<Photo[], Error>) => {
	return useQuery({
		queryKey: albumQueryKeys.albumPhotos(id),
		queryFn: async () => {
			return api.get<Photo[]>(`/api/albums/${id}/photos`)
		},
		...options
	})
}
