import {useCallback, useEffect, useState} from 'react'
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

	// Calculate which photos should be loaded based on visibility and priority
	const updateLoadablePhotos = useCallback(() => {
		const photosWithPriority = photos.map((photo, index): MemoryLimitedPhoto => {
			let priority = 0
			let shouldLoad = false

			// Calculate priority based on distance from visible area
			const visibleCenter = (visibleRange.start + visibleRange.end) / 2
			const distanceFromCenter = Math.abs(index - visibleCenter)

			if (index >= visibleRange.start && index <= visibleRange.end) {
				// Visible photos get highest priority
				priority = 1000 - distanceFromCenter
				shouldLoad = true
			} else if (
				index >= visibleRange.start - preloadBuffer &&
				index <= visibleRange.end + preloadBuffer
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
	}, [photos, visibleRange, maxInMemory, preloadBuffer])

	// Update when dependencies change
	useEffect(() => {
		updateLoadablePhotos()
	}, [updateLoadablePhotos])

	// Get statistics
	const getStats = useCallback(() => {
		const total = memoryPhotos.length
		const shouldLoad = memoryPhotos.filter(p => p.shouldLoad).length
		const visible = memoryPhotos.filter(p => p.shouldLoad && memoryPhotos.indexOf(p) >= visibleRange.start && memoryPhotos.indexOf(p) <= visibleRange.end).length

		return {
			total,
			inMemory: shouldLoad,
			loading: 0,
			highPriority: visible,
			memoryUsagePercentage: (shouldLoad / maxInMemory) * 100,
			queueSize: 0
		}
	}, [memoryPhotos, maxInMemory, visibleRange])

	return {
		memoryPhotos,
		renderablePhotos: memoryPhotos.filter(p => p.shouldLoad),
		getStats,
		maxInMemory
	}
}
