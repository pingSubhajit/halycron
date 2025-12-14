import {useEffect, useState} from 'react'
import {Photo} from '@/app/api/photos/types'
import {useVault} from '@/components/vault-provider'
import {aeadDecrypt, deriveUmkFilenameKey} from '@/lib/crypto/e2ee'

export const useDecryptedFilename = (photo?: Photo | null) => {
	const {umk} = useVault()
	const [filename, setFilename] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		const run = async () => {
			if (!photo) {
				if (mounted) setFilename(null)
				return
			}

			// Legacy
			if ((photo.encryptionVersion ?? 0) !== 1) {
				if (mounted) setFilename(photo.originalFilename ?? null)
				return
			}

			if (!umk || !photo.encryptedFilename || !photo.filenameIv) {
				if (mounted) setFilename(null)
				return
			}

			try {
				const filenameKey = await deriveUmkFilenameKey(umk)
				const bytes = await aeadDecrypt(
					{ciphertextB64: photo.encryptedFilename, nonceB64: photo.filenameIv},
					filenameKey
				)
				const name = new TextDecoder().decode(bytes)
				if (mounted) setFilename(name)
			} catch {
				if (mounted) setFilename(null)
			}
		}
		run()
		return () => {
			mounted = false
		}
	}, [photo, umk])

	return filename
}


