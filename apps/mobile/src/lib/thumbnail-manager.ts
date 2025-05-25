import * as FileSystem from 'expo-file-system'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'

const THUMBNAIL_DIR = `${FileSystem.cacheDirectory}thumbnails/`
const THUMBNAIL_SIZE = 400 // Max width/height for thumbnails
const THUMBNAIL_QUALITY = 0.8 // JPEG quality for thumbnails

interface ThumbnailEntry {
	filePath: string
	timestamp: number
	size: number
	photoId: string
	originalSize: { width: number; height: number }
	thumbnailSize: { width: number; height: number }
}

class ThumbnailManager {
	private thumbnailIndex: Map<string, ThumbnailEntry> = new Map()

	private initialized = false

	private processingQueue: Set<string> = new Set()

	async initialize() {
		if (this.initialized) return

		// Ensure thumbnail directory exists
		const dirInfo = await FileSystem.getInfoAsync(THUMBNAIL_DIR)
		if (!dirInfo.exists) {
			await FileSystem.makeDirectoryAsync(THUMBNAIL_DIR, {intermediates: true})
		}

		// Load existing thumbnail index
		await this.loadThumbnailIndex()

		this.initialized = true
	}

	private async loadThumbnailIndex() {
		try {
			const files = await FileSystem.readDirectoryAsync(THUMBNAIL_DIR)

			for (const fileName of files) {
				if (fileName.endsWith('_thumb.jpg')) {
					const filePath = `${THUMBNAIL_DIR}${fileName}`
					const fileInfo = await FileSystem.getInfoAsync(filePath)

					if (fileInfo.exists && fileInfo.modificationTime) {
						const photoId = fileName.replace('_thumb.jpg', '')
						if (photoId) {
							// Try to get file size, fallback to 0 if not available
							let fileSize = 0
							try {
								const stats = await FileSystem.getInfoAsync(filePath, {size: true})
								fileSize = (stats as any).size || 0
							} catch {
								// Fallback to 0 if size is not available
								fileSize = 0
							}

							this.thumbnailIndex.set(photoId, {
								filePath,
								timestamp: fileInfo.modificationTime * 1000,
								size: fileSize,
								photoId,
								originalSize: {width: 0, height: 0}, // Will be updated when needed
								thumbnailSize: {width: 0, height: 0}
							})
						}
					}
				}
			}
		} catch (error) {
			console.warn('Failed to load thumbnail index:', error)
		}
	}

	private calculateThumbnailSize(originalWidth: number, originalHeight: number): { width: number; height: number } {
		const aspectRatio = originalWidth / originalHeight

		if (originalWidth > originalHeight) {
			// Landscape
			return {
				width: Math.min(THUMBNAIL_SIZE, originalWidth),
				height: Math.min(THUMBNAIL_SIZE, originalWidth) / aspectRatio
			}
		} else {
			// Portrait or square
			return {
				width: Math.min(THUMBNAIL_SIZE, originalHeight) * aspectRatio,
				height: Math.min(THUMBNAIL_SIZE, originalHeight)
			}
		}
	}

	async getExistingThumbnail(photoId: string): Promise<string | null> {
		await this.initialize()

		const existing = this.thumbnailIndex.get(photoId)
		if (existing) {
			const fileInfo = await FileSystem.getInfoAsync(existing.filePath)
			if (fileInfo.exists) {
				return existing.filePath
			} else {
				// Remove stale entry
				this.thumbnailIndex.delete(photoId)
			}
		}

		return null
	}

	async getThumbnail(photoId: string, originalImagePath: string, originalWidth?: number, originalHeight?: number): Promise<string | null> {
		await this.initialize()

		// Check if thumbnail already exists
		const existing = this.thumbnailIndex.get(photoId)
		if (existing) {
			const fileInfo = await FileSystem.getInfoAsync(existing.filePath)
			if (fileInfo.exists) {
				return existing.filePath
			} else {
				// Remove stale entry
				this.thumbnailIndex.delete(photoId)
			}
		}

		// Don't process if we don't have a valid original image path
		if (!originalImagePath || originalImagePath.trim() === '') {
			return null
		}

		// Don't process if already in queue
		if (this.processingQueue.has(photoId)) {
			return null
		}

		// Generate thumbnail
		return this.generateThumbnail(photoId, originalImagePath, originalWidth, originalHeight)
	}

	private async generateThumbnail(
		photoId: string,
		originalImagePath: string,
		originalWidth?: number,
		originalHeight?: number
	): Promise<string | null> {
		this.processingQueue.add(photoId)

		try {
			// Calculate thumbnail dimensions
			const thumbnailSize = originalWidth && originalHeight
				? this.calculateThumbnailSize(originalWidth, originalHeight)
				: {width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE}

			// Generate thumbnail using expo-image-manipulator
			const result = await manipulateAsync(
				originalImagePath,
				[
					{
						resize: {
							width: thumbnailSize.width,
							height: thumbnailSize.height
						}
					}
				],
				{
					compress: THUMBNAIL_QUALITY,
					format: SaveFormat.JPEG
				}
			)

			// Move thumbnail to our cache directory
			const thumbnailFileName = `${photoId}_thumb.jpg`
			const thumbnailPath = `${THUMBNAIL_DIR}${thumbnailFileName}`

			await FileSystem.moveAsync({
				from: result.uri,
				to: thumbnailPath
			})

			/*
			 * Estimate file size based on thumbnail dimensions (rough approximation)
			 * JPEG compression typically results in 0.1-0.3 bytes per pixel for thumbnails
			 */
			const estimatedSize = Math.round(result.width * result.height * 0.2)

			// Update index
			this.thumbnailIndex.set(photoId, {
				filePath: thumbnailPath,
				timestamp: Date.now(),
				size: estimatedSize,
				photoId,
				originalSize: {
					width: originalWidth || 0,
					height: originalHeight || 0
				},
				thumbnailSize: {
					width: result.width,
					height: result.height
				}
			})

			return thumbnailPath
		} catch (error) {
			console.error(`Failed to generate thumbnail for ${photoId}:`, error)
			return null
		} finally {
			this.processingQueue.delete(photoId)
		}
	}

	async clearThumbnails(): Promise<void> {
		try {
			await FileSystem.deleteAsync(THUMBNAIL_DIR, {idempotent: true})
			this.thumbnailIndex.clear()
			this.initialized = false
		} catch (error) {
			console.error('Failed to clear thumbnails:', error)
		}
	}

	getThumbnailStats(): { totalFiles: number; totalSizeMB: number; processingCount: number } {
		const totalFiles = this.thumbnailIndex.size
		const totalSize = Array.from(this.thumbnailIndex.values())
			.reduce((sum, entry) => sum + entry.size, 0)

		return {
			totalFiles,
			totalSizeMB: totalSize / (1024 * 1024),
			processingCount: this.processingQueue.size
		}
	}

	// Clean up old thumbnails (called periodically)
	async cleanupOldThumbnails(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
		const now = Date.now()
		const expiredEntries: string[] = []

		for (const [photoId, entry] of this.thumbnailIndex.entries()) {
			if ((now - entry.timestamp) > maxAgeMs) {
				try {
					await FileSystem.deleteAsync(entry.filePath, {idempotent: true})
					expiredEntries.push(photoId)
				} catch (error) {
					console.warn(`Failed to delete expired thumbnail ${entry.filePath}:`, error)
				}
			}
		}

		expiredEntries.forEach(photoId => this.thumbnailIndex.delete(photoId))
	}
}

export const thumbnailManager = new ThumbnailManager()
