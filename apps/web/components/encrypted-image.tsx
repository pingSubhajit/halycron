'use client'

import {Photo} from '@/app/api/photos/types'
import Image from 'next/image'
import {HTMLProps, useEffect, useState} from 'react'
import {downloadAndDecryptFile} from '@/app/api/photos/utils'
import {cn} from '@halycon/ui/lib/utils'

// Cache for storing decrypted URLs
const decryptedUrlCache = new Map<string, {url: string, timestamp: number}>()

type Props = {
	photo: Photo,
	index: number,
	onClick: (photo: Photo, index: number) => void
}

// Extract the stable part of the S3 URL for caching
const getStableUrlPart = (url: string): string => {
	try {
		const urlObj = new URL(url)
		// Get the pathname without query parameters
		return urlObj.pathname
	} catch (e) {
		return url
	}
}

const ImageSkeleton = (props: HTMLProps<HTMLDivElement>) => (
	<div className={cn('relative overflow-hidden bg-accent animate-pulse w-full h-full', props.className)} style={{paddingBottom: '75%', ...props.style}} {...props}>
		<div className="absolute inset-0" />
	</div>
)

export const EncryptedImage = ({photo, index, onClick}: Props) => {
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const CACHE_EXPIRATION = 60 * 60 * 1000 // 1 hour

	const stableUrlPart = getStableUrlPart(photo.url)
	const cacheKey = `${photo.id}-${stableUrlPart}`

	// Decrypt the photo URL
	useEffect(() => {
		const decryptUrl = async () => {
			// Check cache first
			const cached = decryptedUrlCache.get(cacheKey)
			const now = Date.now()

			if (cached && (now - cached.timestamp) < CACHE_EXPIRATION) {
				setDecryptedUrl(cached.url)
				return
			}

			const decryptedUrl = await downloadAndDecryptFile(photo.url, photo.encryptedKey, photo.keyIv, photo.mimeType)

			// Store in cache
			decryptedUrlCache.set(cacheKey, {
				url: decryptedUrl,
				timestamp: now
			})

			setDecryptedUrl(decryptedUrl)
		}

		decryptUrl()
	}, [cacheKey, photo.url, photo.encryptedKey, photo.keyIv, photo.mimeType])

	if (!decryptedUrl) {
		return <ImageSkeleton style={{
			aspectRatio: `${photo.imageWidth || 800}/${photo.imageHeight || 600}`
		}} />
	}

	return (
		<Image
			src={decryptedUrl}
			alt={photo.originalFilename}
			width={photo.imageWidth || 800}
			height={photo.imageHeight || 600}
			className="w-full h-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
			onClick={() => onClick(photo, index)}
		/>
	)
}

export default EncryptedImage
