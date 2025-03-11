import {useEffect, useState} from 'react'
import {Photo} from '@/app/api/photos/types'
import {downloadAndDecryptFile} from '@/app/api/photos/utils'
import {useDecryptionCache} from '@/stores/decryption-cache'

const getStableUrlPart = (url: string): string => {
	try {
		const urlObj = new URL(url)
		return urlObj.pathname
	} catch (e) {
		return url
	}
}

export const useDecryptedUrl = (photo?: Photo | null) => {
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const {getFromCache, setInCache} = useDecryptionCache()

	useEffect(() => {
		if (!photo) {
			setDecryptedUrl(null)
			return
		}

		const cacheKey = `${photo.id}-${getStableUrlPart(photo.url)}`
		let mounted = true

		const decryptUrl = async () => {
			// Check cache first
			const cachedUrl = getFromCache(cacheKey)
			if (cachedUrl) {
				if (mounted) setDecryptedUrl(cachedUrl)
				return
			}

			// If not in cache, decrypt and cache
			if (mounted) setDecryptedUrl(null) // Clear while loading
			const url = await downloadAndDecryptFile(photo.url, photo.encryptedFileKey, photo.fileKeyIv, photo.mimeType)
			if (mounted) {
				setInCache(cacheKey, url)
				setDecryptedUrl(url)
			} else {
				// If component unmounted before decryption completed, revoke the URL
				URL.revokeObjectURL(url)
			}
		}

		decryptUrl()

		return () => {
			mounted = false
		}
	}, [photo, getFromCache, setInCache])

	return decryptedUrl
}
