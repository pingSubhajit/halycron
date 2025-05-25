import {useCallback, useEffect, useMemo, useState} from 'react'
import {Photo} from '../lib/types'

interface MemoryLimitedPhoto extends Photo {
	shouldLoad: boolean
	priority: number
}

interface UseMemoryLimitedPhotosProps {
	photos: Photo[]
	maxInMemory?: number
	visibleRange?: { start: number; end: number }
	preloadBuffer?: number
}

export const useMemoryLimitedPhotos = ({
	photos,
	maxInMemory = 20,
	visibleRange = {start: 0, end: 10},
	preloadBuffer = 5
}: UseMemoryLimitedPhotosProps) => {
	const [memoryPhotos, setMemoryPhotos] = useState<MemoryLimitedPhoto[]>([])

	// Stabilize the visibleRange values to prevent unnecessary recalculations
	const stableVisibleStart = visibleRange.start
	const stableVisibleEnd = visibleRange.end

	// Calculate which photos should be loaded based on visibility and priority
	const updateLoadablePhotos = useCallback(() => {
		const photosWithPriority = photos.map((photo, index): MemoryLimitedPhoto => {
			let priority = 0
			let shouldLoad = false

			// Calculate priority based on distance from visible area
			const visibleCenter = (stableVisibleStart + stableVisibleEnd) / 2
			const distanceFromCenter = Math.abs(index - visibleCenter)

			if (index >= stableVisibleStart && index <= stableVisibleEnd) {
				// Visible photos get highest priority
				priority = 1000 - distanceFromCenter
				shouldLoad = true
			} else if (
				index >= stableVisibleStart - preloadBuffer &&
				index <= stableVisibleEnd + preloadBuffer
			) {
				// Buffer photos get medium priority
				priority = 500 - distanceFromCenter
			} else {
				// Other photos get low priority
				priority = Math.max(100 - distanceFromCenter, 0)
			}

			return {
				...photo,
				shouldLoad,
				priority
			}
		})

		// Sort by priority and limit the number that should load
		const sortedPhotos = [...photosWithPriority].sort((a, b) => b.priority - a.priority)

		// Mark top priority photos as loadable, up to maxInMemory limit
		const loadablePhotos = sortedPhotos.slice(0, maxInMemory)
		const loadableIds = new Set(loadablePhotos.map(p => p.id))

		// Update shouldLoad based on priority ranking
		const finalPhotos = photosWithPriority.map(photo => ({
			...photo,
			shouldLoad: loadableIds.has(photo.id)
		}))

		setMemoryPhotos(finalPhotos)
	}, [photos, stableVisibleStart, stableVisibleEnd, maxInMemory, preloadBuffer])

	// Update when dependencies change
	useEffect(() => {
		updateLoadablePhotos()
	}, [updateLoadablePhotos])

	// Memoize renderablePhotos to prevent unnecessary recalculations
	const renderablePhotos = useMemo(() => {
		return memoryPhotos.filter(p => p.shouldLoad)
	}, [memoryPhotos])

	// Get statistics
	const getStats = useCallback(() => {
		const total = memoryPhotos.length
		const shouldLoad = memoryPhotos.filter(p => p.shouldLoad).length
		const visible = memoryPhotos.filter(p => p.shouldLoad && memoryPhotos.indexOf(p) >= stableVisibleStart && memoryPhotos.indexOf(p) <= stableVisibleEnd).length

		return {
			total,
			inMemory: shouldLoad,
			loading: 0,
			highPriority: visible,
			memoryUsagePercentage: (shouldLoad / maxInMemory) * 100,
			queueSize: 0
		}
	}, [memoryPhotos, maxInMemory, stableVisibleStart, stableVisibleEnd])

	return {
		memoryPhotos,
		renderablePhotos,
		getStats,
		maxInMemory
	}
}
