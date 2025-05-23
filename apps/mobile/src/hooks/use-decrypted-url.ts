import {useEffect, useState} from 'react'
import {Photo} from '../lib/types'
import {downloadAndDecryptFile} from '../lib/crypto-utils'

const getStableUrlPart = (url: string): string => {
	try {
		const urlObj = new URL(url)
		return urlObj.pathname
	} catch (e) {
		return url
	}
}

// Simple in-memory cache for decrypted URLs
const decryptionCache = new Map<string, string>()

export const useDecryptedUrl = (photo?: Photo | null) => {
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!photo) {
			setDecryptedUrl(null)
			setIsLoading(false)
			setError(null)
			return
		}

		const cacheKey = `${photo.id}-${getStableUrlPart(photo.url)}`
		let mounted = true

		const decryptUrl = async () => {
			// Check cache first
			const cachedUrl = decryptionCache.get(cacheKey)
			if (cachedUrl) {
				if (mounted) {
					setDecryptedUrl(cachedUrl)
					setIsLoading(false)
					setError(null)
				}
				return
			}

			// If not in cache, decrypt and cache
			if (mounted) {
				setDecryptedUrl(null)
				setIsLoading(true)
				setError(null)
			}

			try {
				const url = await downloadAndDecryptFile(
					photo.url,
					photo.encryptedFileKey,
					photo.fileKeyIv,
					photo.mimeType,
					photo.id
				)

				if (mounted) {
					decryptionCache.set(cacheKey, url)
					setDecryptedUrl(url)
					setIsLoading(false)
					setError(null)
				} else {
					// If component unmounted before decryption completed, revoke the URL
					URL.revokeObjectURL(url)
				}
			} catch (err) {
				if (mounted) {
					setError(err instanceof Error ? err.message : 'Failed to decrypt image')
					setIsLoading(false)
				}
			}
		}

		decryptUrl()

		return () => {
			mounted = false
		}
	}, [photo])

	return {
		decryptedUrl,
		isLoading,
		error
	}
}
