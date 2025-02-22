import {QueryOptions, useQuery} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {api} from '@/lib/data/api-client'
import {Photo} from '@/app/api/photos/types'
import {SetStateAction, useEffect, useRef} from 'react'
import {downloadAndDecryptFile} from '@/app/api/photos/utils'

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

export const useAllPhotos = (
	setTotal?: (total: number) => void,
	setPhotos?: (value: SetStateAction<Photo[]>) => void,
	setLoaded?: (loaded: number) => void,
	setDimensions?: (value: SetStateAction<{width: number, height: number, id: string}[]>) => void,
	options?: QueryOptions<Photo[], Error>
) => {
	// Create a ref to store the decrypted URLs cache
	const urlCache = useRef<DecryptedUrlCache>({})

	// Cache expiration time (1 hour in milliseconds)
	const CACHE_EXPIRATION = 60 * 60 * 1000

	// Debug log the cache contents whenever it changes
	useEffect(() => {
		console.log('Current cache contents:', urlCache.current)
	}, [])

	return useQuery({
		queryKey: photoQueryKeys.allPhotos(),
		queryFn: async () => {
			setLoaded?.(0)
			setPhotos?.([])

			const response = await api.get<Photo[]>('/api/photos')
			console.log('Fetched photos response:', response.length, 'photos')
			setTotal?.(response.length)

			const photos = []
			setDimensions?.(response.map(photo => ({
				width: photo.imageWidth || 800,
				height: photo.imageHeight || 600,
				id: photo.id
			})))

			for (let i = 0; i < response.length; i++) {
				const photo = response[i]!
				const stableUrlPart = getStableUrlPart(photo.url)
				const cacheKey = `${photo.id}-${stableUrlPart}`

				console.log('Processing photo:', {
					id: photo.id,
					cacheKey,
					stableUrlPart,
					hasCachedData: !!urlCache.current[cacheKey]
				})

				const cachedData = urlCache.current[cacheKey]
				const now = Date.now()

				// Check if we have a valid cached URL
				if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRATION) {
					console.log('Cache hit for photo:', photo.id, 'Using cached URL')
					photo.url = cachedData.url
				} else {
					console.log('Cache miss for photo:', photo.id, 'Decrypting...')
					// Decrypt and cache the URL if not found or expired
					const decryptedUrl = await downloadAndDecryptFile(photo.url, photo.encryptedKey, photo.keyIv, photo.mimeType)
					photo.url = decryptedUrl

					// Update cache
					urlCache.current[cacheKey] = {
						url: decryptedUrl,
						timestamp: now
					}
					console.log('Cached new URL for photo:', photo.id)
				}

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
