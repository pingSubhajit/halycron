'use client'

import {useEffect, useState} from 'react'
import {SharedPhoto} from '@/app/api/shared/types'
import {downloadAndDecryptFile} from '@/app/api/photos/utils'
import {aeadDecrypt} from '@/lib/crypto/e2ee'

const SharedEncryptedThumb = ({photo, shareKey}: {photo: SharedPhoto; shareKey: Uint8Array}) => {
	const [url, setUrl] = useState<string | null>(null)
	const [name, setName] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		const run = async () => {
			try {
				if (!photo.wrappedDekForShare || !photo.wrappedDekForShareIv) return
				const dek = await aeadDecrypt({ciphertextB64: photo.wrappedDekForShare, nonceB64: photo.wrappedDekForShareIv}, shareKey)
				const objectUrl = await downloadAndDecryptFile(photo.url, dek, photo.contentIv, photo.mimeType)
				if (mounted) setUrl(objectUrl)

				if (photo.encryptedFilenameForShare && photo.filenameForShareIv) {
					const bytes = await aeadDecrypt({ciphertextB64: photo.encryptedFilenameForShare, nonceB64: photo.filenameForShareIv}, shareKey)
					if (mounted) setName(new TextDecoder().decode(bytes))
				}
			} catch {
				if (mounted) setUrl(null)
			}
		}
		run()
		return () => {
			mounted = false
		}
	}, [photo, shareKey])

	if (!url) {
		return (
			<div className="relative overflow-hidden bg-accent animate-pulse w-full"
				style={{paddingBottom: '75%'}} />
		)
	}

	return (
		<div className="relative overflow-hidden">
			<img
				src={url}
				alt={name || 'Shared photo'}
				className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
			/>
		</div>
	)
}

export const SharedGallery = ({photos, shareKey}: {photos: SharedPhoto[]; shareKey: Uint8Array | null}) => {
	if (!photos.length) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<p className="text-sm text-muted-foreground">No photos</p>
			</div>
		)
	}

	if (!shareKey) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
				{Array.from({length: Math.min(photos.length, 8)}).map((_, i) => (
					<div
						key={i}
						className="relative overflow-hidden bg-accent animate-pulse w-full"
						style={{paddingBottom: '75%'}}
					/>
				))}
			</div>
		)
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
			{photos.map((p) => (
				<div key={p.id} className="break-inside-avoid hover:ring-2 hover:ring-primary transition duration-200">
					<SharedEncryptedThumb photo={p} shareKey={shareKey}/>
				</div>
			))}
		</div>
	)
}


