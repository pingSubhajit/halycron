import {useEffect, useState} from 'react'
import {Photo} from '../lib/types'
import {downloadAndDecryptFile} from '../lib/crypto-utils'

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

		let mounted = true

		const decryptUrl = async () => {
			if (mounted) {
				setDecryptedUrl(null)
				setIsLoading(true)
				setError(null)
			}

			try {
				// downloadAndDecryptFile now returns a file path instead of data URL
				const filePath = await downloadAndDecryptFile(
					photo.url,
					photo.encryptedFileKey,
					photo.fileKeyIv,
					photo.mimeType,
					photo.id
				)

				if (mounted) {
					setDecryptedUrl(filePath)
					setIsLoading(false)
					setError(null)
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
