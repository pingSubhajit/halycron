import {aeadEncrypt, deriveUmkFileWrapKey, deriveUmkFilenameKey} from '@/lib/crypto/e2ee'
import {Photo} from '@/app/api/photos/types'

/**
 * Build v1 migration payload for a legacy (v0) photo row.
 * The caller must provide the UMK and the legacy plaintext DEK + filename fields must exist.
 */
export async function buildPhotoMigrationPayload(photo: Photo, umk: Uint8Array) {
	if ((photo.encryptionVersion ?? 0) !== 0) {
		throw new Error('Photo is not legacy')
	}
	if (!photo.encryptedFileKey || !photo.fileKeyIv || !photo.originalFilename) {
		throw new Error('Missing legacy key material')
	}

	// Legacy per-photo key is base64 bytes.
	const dekBytes = Uint8Array.from(atob(photo.encryptedFileKey), c => c.charCodeAt(0))
	const wrapKey = await deriveUmkFileWrapKey(umk)
	const wrappedDek = await aeadEncrypt(dekBytes, wrapKey)

	const filenameKey = await deriveUmkFilenameKey(umk)
	const encName = await aeadEncrypt(new TextEncoder().encode(photo.originalFilename), filenameKey)

	return {
		photoId: photo.id,
		contentIv: photo.fileKeyIv,
		wrappedDek: wrappedDek.ciphertextB64,
		wrappedDekIv: wrappedDek.nonceB64,
		encryptedFilename: encName.ciphertextB64,
		filenameIv: encName.nonceB64
	}
}


