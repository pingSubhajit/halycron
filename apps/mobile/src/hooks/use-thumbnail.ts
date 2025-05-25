import {useEffect, useState} from 'react'
import {Photo} from '../lib/types'
import {thumbnailManager} from '../lib/thumbnail-manager'
import {useDecryptedUrl} from './use-decrypted-url'

interface UseThumbnailResult {
	thumbnailUrl: string | null
	isLoadingThumbnail: boolean
	isGeneratingThumbnail: boolean
	error: string | null
}

export const useThumbnail = (photo?: Photo | null): UseThumbnailResult => {
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
	const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false)
	const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Get the full-size decrypted image (for thumbnail generation)
	const {decryptedUrl: fullSizeUrl, isLoading: isLoadingFullSize, error: fullSizeError} = useDecryptedUrl(photo)

	useEffect(() => {
		if (!photo) {
			setThumbnailUrl(null)
			setIsLoadingThumbnail(false)
			setIsGeneratingThumbnail(false)
			setError(null)
			return
		}

		let mounted = true

		const loadThumbnail = async () => {
			if (mounted) {
				setIsLoadingThumbnail(true)
				setError(null)
			}

			try {
				// First, check if thumbnail already exists
				const existingThumbnail = await thumbnailManager.getExistingThumbnail(photo.id)

				if (existingThumbnail && mounted) {
					setThumbnailUrl(existingThumbnail)
					setIsLoadingThumbnail(false)
					return
				}

				// If no existing thumbnail and we have the full-size image, generate thumbnail
				if (fullSizeUrl && !isLoadingFullSize && mounted) {
					setIsGeneratingThumbnail(true)

					const newThumbnail = await thumbnailManager.getThumbnail(
						photo.id,
						fullSizeUrl,
						photo.imageWidth || undefined,
						photo.imageHeight || undefined
					)

					if (newThumbnail && mounted) {
						setThumbnailUrl(newThumbnail)
					}

					if (mounted) {
						setIsGeneratingThumbnail(false)
					}
				}

				if (mounted) {
					setIsLoadingThumbnail(false)
				}
			} catch (err) {
				if (mounted) {
					setError(err instanceof Error ? err.message : 'Failed to load thumbnail')
					setIsLoadingThumbnail(false)
					setIsGeneratingThumbnail(false)
				}
			}
		}

		loadThumbnail()

		return () => {
			mounted = false
		}
	}, [photo, fullSizeUrl, isLoadingFullSize])

	// If we have a full-size error, propagate it
	useEffect(() => {
		if (fullSizeError) {
			setError(fullSizeError)
		}
	}, [fullSizeError])

	return {
		thumbnailUrl,
		isLoadingThumbnail: isLoadingThumbnail || isLoadingFullSize,
		isGeneratingThumbnail,
		error
	}
}
