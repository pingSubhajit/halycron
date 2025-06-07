import {QueryOptions, useQuery} from '@tanstack/react-query'
import {api} from '@/lib/data/api-client'
import {StorageStats} from './route'

export const storageQueryKeys = {
	all: ['storage'] as const,
	stats: () => [...storageQueryKeys.all, 'stats'] as const
}

export const useStorageStats = (options?: QueryOptions<StorageStats, Error>) => {
	return useQuery({
		queryKey: storageQueryKeys.stats(),
		queryFn: async () => {
			return api.get<StorageStats>('/api/storage')
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		...options
	})
}
