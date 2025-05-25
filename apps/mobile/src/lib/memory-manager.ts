import {fileCacheManager} from './file-cache-manager'

class MemoryManager {
	private static instance: MemoryManager

	private memoryWarningListeners: (() => void)[] = []

	static getInstance(): MemoryManager {
		if (!MemoryManager.instance) {
			MemoryManager.instance = new MemoryManager()
		}
		return MemoryManager.instance
	}

	// Add a listener for memory warnings
	addMemoryWarningListener(callback: () => void) {
		this.memoryWarningListeners.push(callback)
	}

	// Remove a memory warning listener
	removeMemoryWarningListener(callback: () => void) {
		const index = this.memoryWarningListeners.indexOf(callback)
		if (index > -1) {
			this.memoryWarningListeners.splice(index, 1)
		}
	}

	// Trigger memory cleanup
	async handleMemoryWarning() {
		// Notify all listeners
		this.memoryWarningListeners.forEach(callback => {
			try {
				callback()
			} catch (error) {

			}
		})

		// Perform cache cleanup
		await this.performCacheCleanup()
	}

	// Perform aggressive cache cleanup
	private async performCacheCleanup() {
		try {
			const stats = fileCacheManager.getCacheStats()

			// If cache is larger than 200MB, clear some of it
			if (stats.totalSizeMB > 200) {
				/*
				 * For now, we'll clear the entire cache on memory pressure
				 * In a more sophisticated implementation, you could clear only older files
				 */
				await fileCacheManager.clearCache()
			}
		} catch (error) {

		}
	}

	// Get memory usage statistics
	getMemoryStats() {
		const cacheStats = fileCacheManager.getCacheStats()

		return {
			cacheFiles: cacheStats.totalFiles,
			cacheSizeMB: cacheStats.totalSizeMB
			// Add more memory stats as needed
		}
	}

	// Preemptive cleanup based on cache size
	async performPreemptiveCleanup() {
		const stats = fileCacheManager.getCacheStats()

		// If cache is getting large, perform cleanup
		if (stats.totalSizeMB > 500) { // 400MB threshold
			await this.performCacheCleanup()
		}
	}
}

export const memoryManager = MemoryManager.getInstance()

// Hook for React components to use memory management
export const useMemoryManager = () => {
	const handleMemoryWarning = () => {
		memoryManager.handleMemoryWarning()
	}

	const getStats = () => {
		return memoryManager.getMemoryStats()
	}

	const performCleanup = () => {
		return memoryManager.performPreemptiveCleanup()
	}

	return {
		handleMemoryWarning,
		getStats,
		performCleanup
	}
}
