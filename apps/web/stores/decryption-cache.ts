import {create} from 'zustand'

type CacheEntry = {
	url: string
	timestamp: number
}

interface DecryptionCacheState {
	cache: Map<string, CacheEntry>
	CACHE_EXPIRATION: number
	getFromCache: (key: string) => string | null
	setInCache: (key: string, url: string) => void
	clearCache: () => void
}

const revokeUrl = (url: string) => {
	try {
		URL.revokeObjectURL(url)
	} catch (e) {
		// Ignore errors if URL is already revoked
	}
}

export const useDecryptionCache = create<DecryptionCacheState>((set, get) => ({
	cache: new Map(),
	CACHE_EXPIRATION: 60 * 60 * 1000, // 1 hour

	getFromCache: (key: string) => {
		const cache = get().cache
		const entry = cache.get(key)
		const now = Date.now()

		if (entry && (now - entry.timestamp) < get().CACHE_EXPIRATION) {
			return entry.url
		}

		if (entry) {
			// Revoke and remove expired entry
			revokeUrl(entry.url)
			cache.delete(key)
			set({cache: new Map(cache)})
		}

		return null
	},

	setInCache: (key: string, url: string) => {
		const cache = get().cache
		const oldEntry = cache.get(key)
		if (oldEntry) {
			revokeUrl(oldEntry.url)
		}
		cache.set(key, {
			url,
			timestamp: Date.now()
		})
		set({cache: new Map(cache)})
	},

	clearCache: () => {
		const cache = get().cache
		// Revoke all URLs before clearing
		cache.forEach(entry => revokeUrl(entry.url))
		set({cache: new Map()})
	}
})) 