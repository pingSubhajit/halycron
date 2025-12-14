import {useEffect, useState} from 'react'
import {Photo} from '@/app/api/photos/types'
import {downloadAndDecryptFile} from '@/app/api/photos/utils'
import {useDecryptionCache} from '@/stores/decryption-cache'
import {useVault} from '@/components/vault-provider'
import {aeadDecrypt, deriveUmkFileWrapKey} from '@/lib/crypto/e2ee'

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
	const {umk} = useVault()

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

			let dekBytes: Uint8Array
			let ivHex: string

			const looksV1 = (photo.encryptionVersion ?? 0) === 1 || Boolean(photo.wrappedDek && photo.wrappedDekIv && photo.contentIv)

			if (looksV1) {
				if (!umk || !photo.wrappedDek || !photo.wrappedDekIv || !photo.contentIv) {
					// Can't decrypt yet (vault locked), but don’t hard-crash the page.
					return
				}
				const wrapKey = await deriveUmkFileWrapKey(umk)
				dekBytes = await aeadDecrypt({ciphertextB64: photo.wrappedDek, nonceB64: photo.wrappedDekIv}, wrapKey)
				ivHex = photo.contentIv
			} else {
				if (!photo.encryptedFileKey || !photo.fileKeyIv) {
					// Bad/partial legacy row; don’t crash UI.
					return
				}
				dekBytes = Uint8Array.from(atob(photo.encryptedFileKey), c => c.charCodeAt(0))
				ivHex = photo.fileKeyIv
			}

			const url = await downloadAndDecryptFile(photo.url, dekBytes, ivHex, photo.mimeType)
			if (mounted) {
				setInCache(cacheKey, url)
				setDecryptedUrl(url)
			} else {
				// If component unmounted before decryption completed, revoke the URL
				URL.revokeObjectURL(url)
			}
		}

		decryptUrl().catch(() => {
			// Swallow errors to prevent app-level runtime crashes; the UI will just keep the placeholder.
			if (mounted) setDecryptedUrl(null)
		})

		return () => {
			mounted = false
		}
	}, [photo, getFromCache, setInCache])

	return decryptedUrl
}
