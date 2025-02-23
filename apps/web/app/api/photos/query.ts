import {QueryOptions, useQuery} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {api} from '@/lib/data/api-client'
import {Photo} from '@/app/api/photos/types'

// Cache type to store decrypted URLs
type DecryptedUrlCache = {
	[key: string]: {
		url: string;
		timestamp: number;
	};
};

// Extract the stable part of the S3 URL for caching
const getStableUrlPart = (url: string): string => {
	try {
		const urlObj = new URL(url)
		// Get the pathname without query parameters
		return urlObj.pathname
	} catch (e) {
		return url
	}
}

export const useAllPhotos = (options?: QueryOptions<Photo[], Error>) => {
	return useQuery({
		queryKey: photoQueryKeys.allPhotos(),
		queryFn: async () => {
			return api.get<Photo[]>('/api/photos')
		},
		...options
	})
}
