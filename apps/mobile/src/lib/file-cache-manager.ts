import * as FileSystem from 'expo-file-system'
import crypto from 'react-native-quick-crypto'
import {Buffer} from 'buffer'

const CACHE_DIR = `${FileSystem.cacheDirectory}decrypted_images/`
const MAX_CACHE_SIZE_MB = 500 // 500MB cache limit
const CACHE_EXPIRY_DAYS = 7 // Cache files for 7 days

interface CacheEntry {
	filePath: string
	timestamp: number
	size: number
	photoId: string
}

class FileCacheManager {
	private cacheIndex: Map<string, CacheEntry> = new Map()

	private initialized = false

	async initialize() {
		if (this.initialized) return

		// Ensure cache directory exists
		const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR)
		if (!dirInfo.exists) {
			await FileSystem.makeDirectoryAsync(CACHE_DIR, {intermediates: true})
		}

		// Load existing cache index
		await this.loadCacheIndex()

		// Clean up expired files
		await this.cleanupExpiredFiles()

		this.initialized = true
	}

	private async loadCacheIndex() {
		try {
			const files = await FileSystem.readDirectoryAsync(CACHE_DIR)

			for (const fileName of files) {
				if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.webp')) {
					const filePath = `${CACHE_DIR}${fileName}`
					const fileInfo = await FileSystem.getInfoAsync(filePath)

					if (fileInfo.exists && fileInfo.modificationTime) {
						const photoId = fileName.split('_')[0] // Extract photo ID from filename
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

							this.cacheIndex.set(photoId, {
								filePath,
								timestamp: fileInfo.modificationTime * 1000, // Convert to milliseconds
								size: fileSize,
								photoId
							})
						}
					}
				}
			}
		} catch (error) {
			console.warn('Failed to load cache index:', error)
		}
	}

	private async cleanupExpiredFiles() {
		const now = Date.now()
		const expiredEntries: string[] = []

		for (const [photoId, entry] of this.cacheIndex.entries()) {
			const isExpired = (now - entry.timestamp) > (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

			if (isExpired) {
				try {
					await FileSystem.deleteAsync(entry.filePath, {idempotent: true})
					expiredEntries.push(photoId)
				} catch (error) {
					console.warn(`Failed to delete expired file ${entry.filePath}:`, error)
				}
			}
		}

		// Remove expired entries from index
		expiredEntries.forEach(photoId => this.cacheIndex.delete(photoId))
	}

	private async enforceCacheSize() {
		const totalSize = Array.from(this.cacheIndex.values())
			.reduce((sum, entry) => sum + entry.size, 0)

		if (totalSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
			// Sort by timestamp (oldest first)
			const sortedEntries = Array.from(this.cacheIndex.entries())
				.sort(([, a], [, b]) => a.timestamp - b.timestamp)

			let currentSize = totalSize
			const targetSize = MAX_CACHE_SIZE_MB * 0.8 * 1024 * 1024 // Remove until 80% of limit

			for (const [photoId, entry] of sortedEntries) {
				if (currentSize <= targetSize) break

				try {
					await FileSystem.deleteAsync(entry.filePath, {idempotent: true})
					this.cacheIndex.delete(photoId)
					currentSize -= entry.size
				} catch (error) {
					console.warn(`Failed to delete cache file ${entry.filePath}:`, error)
				}
			}
		}
	}

	private getFileExtension(mimeType: string): string {
		switch (mimeType) {
		case 'image/jpeg':
			return '.jpg'
		case 'image/png':
			return '.png'
		case 'image/webp':
			return '.webp'
		default:
			return '.jpg'
		}
	}

	private generateCacheKey(photoId: string, url: string): string {
		// Create a stable cache key based on photo ID and URL
		const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8)
		return `${photoId}_${urlHash}`
	}

	async getCachedFile(photoId: string, url: string): Promise<string | null> {
		await this.initialize()

		const entry = this.cacheIndex.get(photoId)
		if (!entry) return null

		// Check if file still exists
		const fileInfo = await FileSystem.getInfoAsync(entry.filePath)
		if (!fileInfo.exists) {
			this.cacheIndex.delete(photoId)
			return null
		}

		// Update access time
		entry.timestamp = Date.now()

		return entry.filePath
	}

	async cacheDecryptedFile(
		photoId: string,
		url: string,
		decryptedData: Buffer,
		mimeType: string
	): Promise<string> {
		await this.initialize()

		const cacheKey = this.generateCacheKey(photoId, url)
		const extension = this.getFileExtension(mimeType)
		const fileName = `${cacheKey}${extension}`
		const filePath = `${CACHE_DIR}${fileName}`

		try {
			// Write the decrypted data to file
			const base64Data = decryptedData.toString('base64')
			await FileSystem.writeAsStringAsync(filePath, base64Data, {
				encoding: FileSystem.EncodingType.Base64
			})

			// Get file size - use the buffer size as FileInfo doesn't always have size
			const fileSize = decryptedData.length

			// Update cache index
			this.cacheIndex.set(photoId, {
				filePath,
				timestamp: Date.now(),
				size: fileSize,
				photoId
			})

			// Enforce cache size limits
			await this.enforceCacheSize()

			return filePath
		} catch (error) {
			console.error('Failed to cache decrypted file:', error)
			throw error
		}
	}

	async clearCache(): Promise<void> {
		try {
			await FileSystem.deleteAsync(CACHE_DIR, {idempotent: true})
			this.cacheIndex.clear()
			this.initialized = false
		} catch (error) {
			console.error('Failed to clear cache:', error)
		}
	}

	getCacheStats(): { totalFiles: number; totalSizeMB: number } {
		const totalFiles = this.cacheIndex.size
		const totalSize = Array.from(this.cacheIndex.values())
			.reduce((sum, entry) => sum + entry.size, 0)

		return {
			totalFiles,
			totalSizeMB: totalSize / (1024 * 1024)
		}
	}
}

export const fileCacheManager = new FileCacheManager()
