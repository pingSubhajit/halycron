import {useEffect, useState} from 'react'
import {Photo} from '@/app/api/photos/types'
import {downloadAndDecryptFile, getUserKey} from '@/app/api/photos/utils'
import {useDecryptionCache} from '@/stores/decryption-cache'

const getStableUrlPart = (url: string): string => {
	try {
		const urlObj = new URL(url)
		return urlObj.pathname
	} catch (e) {
		return url
	}
}

export const useDecryptedUrl = (photo?: Photo | null, password?: string) => {
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const {getFromCache, setInCache} = useDecryptionCache()

	useEffect(() => {
		if (!photo) {
			setDecryptedUrl(null)
			setError(null)
			return
		}

		if (!password) {
			setError(new Error('Password is required for decryption'))
			return
		}

		const cacheKey = `${photo.id}-${getStableUrlPart(photo.url)}`
		let mounted = true

		const decryptUrl = async () => {
			try {
				// Check cache first
				const cachedUrl = getFromCache(cacheKey)
				if (cachedUrl) {
					if (mounted) {
						setDecryptedUrl(cachedUrl)
						setError(null)
					}
					return
				}

				// If not in cache, decrypt and cache
				if (mounted) {
					setDecryptedUrl(null) // Clear while loading
					setError(null)
				}

				// Get the user key using the password
				const userKey = await getUserKey(password)

				// Use the user key to decrypt the file
				const url = await downloadAndDecryptFile(
					photo.url,
					photo.encryptedFileKey,
					photo.fileKeyIv,
					photo.fileIv || '', // Assuming fileIv might be stored in the photo object
					photo.mimeType,
					userKey
				)

				if (mounted) {
					setInCache(cacheKey, url)
					setDecryptedUrl(url)
				} else {
					// If component unmounted before decryption completed, revoke the URL
					URL.revokeObjectURL(url)
				}
			} catch (err) {
				if (mounted) {
					setError(err instanceof Error ? err : new Error('Failed to decrypt photo'))
				}
			}
		}

		decryptUrl()

		return () => {
			mounted = false
		}
	}, [photo, password, getFromCache, setInCache])

	return {decryptedUrl, error}
}
