import {useEffect, useState} from 'react'
import {Photo} from '../lib/types'
import {downloadAndDecryptFile} from '../lib/crypto-utils'
import {useVault} from '@/src/components/vault-provider'
import {aeadDecrypt, deriveUmkFileWrapKey} from '@/src/lib/crypto/e2ee'
import {base64ToUint8Array} from '@/src/lib/base64-utils'

export const useDecryptedUrl = (photo?: Photo | null) => {
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const {umk} = useVault()

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
				let dekBytes: Uint8Array
				let ivHex: string

				if ((photo.encryptionVersion ?? 0) === 1) {
					if (!umk || !photo.wrappedDek || !photo.wrappedDekIv || !photo.contentIv) {
						throw new Error('Vault locked or missing key material')
					}
					const wrapKey = await deriveUmkFileWrapKey(umk)
					dekBytes = await aeadDecrypt({ciphertextB64: photo.wrappedDek, nonceB64: photo.wrappedDekIv}, wrapKey)
					ivHex = photo.contentIv
				} else {
					if (!photo.encryptedFileKey || !photo.fileKeyIv) {
						throw new Error('Missing legacy key material')
					}
					dekBytes = base64ToUint8Array(photo.encryptedFileKey)
					ivHex = photo.fileKeyIv
				}

				// downloadAndDecryptFile now returns a file path instead of data URL
				const filePath = await downloadAndDecryptFile(
					photo.url,
					dekBytes,
					ivHex,
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
