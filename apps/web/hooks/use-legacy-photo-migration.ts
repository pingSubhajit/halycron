import {useCallback, useMemo, useState} from 'react'
import {useAllPhotos} from '@/app/api/photos/query'
import {useVault} from '@/components/vault-provider'
import {api} from '@/lib/data/api-client'
import {buildPhotoMigrationPayload} from '@/app/api/photos/migrations'

export const useLegacyPhotoMigration = () => {
	const {data: photos, refetch} = useAllPhotos()
	const {umk} = useVault()
	const [isMigrating, setIsMigrating] = useState(false)
	const [lastError, setLastError] = useState<string | null>(null)

	const legacyCount = useMemo(() => {
		if (!photos) return 0
		return photos.filter(p => (p.encryptionVersion ?? 0) === 0).length
	}, [photos])

	const migrateBatch = useCallback(async (limit = 10) => {
		if (!umk) throw new Error('Vault locked')
		if (!photos) return
		setIsMigrating(true)
		setLastError(null)
		try {
			const legacy = photos.filter(p => (p.encryptionVersion ?? 0) === 0).slice(0, limit)
			for (const p of legacy) {
				const payload = await buildPhotoMigrationPayload(p, umk)
				await api.post('/api/photos/migrate', payload)
				// Migrate S3 key to remove filename leakage in object keys (best-effort; can be retried)
				await api.post('/api/photos/migrate-s3-key', {photoId: p.id})
			}
			await refetch()
		} catch (e) {
			setLastError(e instanceof Error ? e.message : 'Migration failed')
			throw e
		} finally {
			setIsMigrating(false)
		}
	}, [umk, photos, refetch])

	return {legacyCount, isMigrating, lastError, migrateBatch}
}


