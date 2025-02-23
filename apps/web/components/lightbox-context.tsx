'use client'

import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react'
import {Photo} from '@/app/api/photos/types'
import Image from 'next/image'
import {ChevronLeft, ChevronRight, Minus, Plus, Trash2, X} from 'lucide-react'
import {AnimatePresence, motion} from 'framer-motion'
import {Button} from '@halycon/ui/components/button'
import {useDecryptedUrl} from '@/hooks/use-decrypted-url'

interface LightboxContextType {
  openLightbox: (photo: Photo, hasNext?: boolean, hasPrev?: boolean, onDelete?: () => void) => void
  closeLightbox: () => void
  onNext?: () => Promise<Photo | null>
  onPrev?: () => Promise<Photo | null>
  setNavigationHandlers: (handlers: { onNext?: () => Promise<Photo | null>, onPrev?: () => Promise<Photo | null> }) => void
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined)

export const useLightbox = () => {
	const context = useContext(LightboxContext)
	if (!context) {
		throw new Error('useLightbox must be used within a LightboxProvider')
	}
	return context
}

const Lightbox = ({
	photo,
	hasNext,
	hasPrev,
	onClose,
	onDelete,
	onNext,
	onPrev
}: {
	photo: Photo
	hasNext?: boolean
	hasPrev?: boolean
	onClose: () => void
	onDelete?: () => void
	onNext?: () => Promise<Photo | null>
	onPrev?: () => Promise<Photo | null>
}) => {
	const decryptedUrl = useDecryptedUrl(photo)
	const [loading, setLoading] = useState(false)
	const [scale, setScale] = useState(1)
	const [position, setPosition] = useState({x: 0, y: 0})
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState({x: 0, y: 0})
	const [pinchStart, setPinchStart] = useState<{ distance: number, scale: number } | null>(null)
	const imageRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const handleDelete = () => {
		onDelete?.()
		onClose()
	}

	const handleNext = async () => {
		if (!onNext || !hasNext || loading) return
		setLoading(true)
		const success = await onNext()
		setLoading(false)
		// Reset zoom when navigating
		setScale(1)
		setPosition({x: 0, y: 0})
	}

	const handlePrev = async () => {
		if (!onPrev || !hasPrev || loading) return
		setLoading(true)
		const success = await onPrev()
		setLoading(false)
		// Reset zoom when navigating
		setScale(1)
		setPosition({x: 0, y: 0})
	}

	const handleZoom = (zoomIn: boolean) => {
		const zoomFactor = 0.3
		const newScale = Math.max(1, Math.min(5, scale + (zoomIn ? zoomFactor : -zoomFactor)))

		if (newScale === scale) return

		if (newScale === 1) {
			setScale(1)
			setPosition({x: 0, y: 0})
			return
		}

		setScale(newScale)
	}

	const calculateTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
		const dx = touch1.clientX - touch2.clientX
		const dy = touch1.clientY - touch2.clientY
		return Math.sqrt(dx * dx + dy * dy)
	}

	const handleMouseDown = (e: React.MouseEvent) => {
		if (scale === 1) return // Only allow dragging when zoomed in
		setIsDragging(true)
		setDragStart({x: e.clientX - position.x, y: e.clientY - position.y})
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging || !imageRef.current || !containerRef.current) return

		const imageRect = imageRef.current.getBoundingClientRect()
		const containerRect = containerRef.current.getBoundingClientRect()

		const newX = e.clientX - dragStart.x
		const newY = e.clientY - dragStart.y

		updatePosition(newX, newY, imageRect, containerRect)
	}

	const handleMouseUp = () => {
		setIsDragging(false)
	}

	const updatePosition = (newX: number, newY: number, imageRect: DOMRect, containerRect: DOMRect) => {
		// Calculate bounds
		const scaledWidth = imageRect.width * scale
		const scaledHeight = imageRect.height * scale
		const minX = Math.min(0, -(scaledWidth - containerRect.width) / 2)
		const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2)
		const minY = Math.min(0, -(scaledHeight - containerRect.height) / 2)
		const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2)

		// Clamp position within bounds
		const clampedPosition = {
			x: Math.min(maxX, Math.max(minX, newX)),
			y: Math.min(maxY, Math.max(minY, newY))
		}

		setPosition(clampedPosition)
	}

	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			// Pinch gesture starting
			if (!e.touches[0] || !e.touches[1]) return
			const distance = calculateTouchDistance(e.touches[0], e.touches[1])
			setPinchStart({distance, scale})
			setIsDragging(false)
		} else if (e.touches.length === 1) {
			// Single touch for panning
			if (scale === 1 || !e.touches[0]) return
			setIsDragging(true)
			setDragStart({
				x: e.touches[0].clientX - position.x,
				y: e.touches[0].clientY - position.y
			})
		}
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		e.preventDefault() // Prevent scrolling while interacting

		if (!imageRef.current || !containerRef.current) return

		if (e.touches.length === 2 && pinchStart && e.touches[0] && e.touches[1]) {
			// Handle pinch gesture
			const distance = calculateTouchDistance(e.touches[0], e.touches[1])
			const pinchScale = distance / pinchStart.distance
			const newScale = Math.max(1, Math.min(5, pinchStart.scale * pinchScale))

			if (newScale === scale) return

			// Calculate the center point of the pinch
			const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
			const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2

			const imageRect = imageRef.current.getBoundingClientRect()
			const containerRect = containerRef.current.getBoundingClientRect()

			// Calculate position relative to image center
			const mouseX = centerX - (imageRect.left + imageRect.width / 2)
			const mouseY = centerY - (imageRect.top + imageRect.height / 2)

			// Calculate new position to zoom towards pinch center
			const scaleChange = newScale - scale
			const newPosition = {
				x: position.x - (mouseX * scaleChange),
				y: position.y - (mouseY * scaleChange)
			}

			// Keep image within container bounds
			const scaledWidth = imageRect.width * newScale
			const scaledHeight = imageRect.height * newScale

			// Calculate bounds
			const minX = Math.min(0, -(scaledWidth - containerRect.width) / 2)
			const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2)
			const minY = Math.min(0, -(scaledHeight - containerRect.height) / 2)
			const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2)

			// Clamp position within bounds
			const clampedPosition = {
				x: Math.min(maxX, Math.max(minX, newPosition.x)),
				y: Math.min(maxY, Math.max(minY, newPosition.y))
			}

			setScale(newScale)
			setPosition(clampedPosition)
		} else if (e.touches.length === 1 && isDragging && e.touches[0]) {
			// Handle panning
			const imageRect = imageRef.current.getBoundingClientRect()
			const containerRect = containerRef.current.getBoundingClientRect()

			const newX = e.touches[0].clientX - dragStart.x
			const newY = e.touches[0].clientY - dragStart.y

			updatePosition(newX, newY, imageRect, containerRect)
		}
	}

	const handleTouchEnd = () => {
		setIsDragging(false)
		setPinchStart(null)
	}

	// Handle keyboard navigation and zoom
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
			case 'Escape':
				onClose()
				break
			case 'ArrowLeft':
				if (hasPrev && !loading) handlePrev()
				break
			case 'ArrowRight':
				if (hasNext && !loading) handleNext()
				break
			}
		}

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault()

			if (!imageRef.current || !containerRef.current) return

			const imageRect = imageRef.current.getBoundingClientRect()
			const containerRect = containerRef.current.getBoundingClientRect()

			// Calculate zoom
			const delta = -e.deltaY
			const zoomFactor = 0.3
			const newScale = Math.max(1, Math.min(5, scale + (delta > 0 ? zoomFactor : -zoomFactor)))

			if (newScale === scale) return

			// If zooming out to scale 1, center the image
			if (newScale === 1) {
				setScale(1)
				setPosition({x: 0, y: 0})
				return
			}

			const isOutside = e.clientX < imageRect.left || e.clientX > imageRect.right ||
				e.clientY < imageRect.top || e.clientY > imageRect.bottom

			let mouseX, mouseY
			if (isOutside) {
				// When outside, zoom relative to the nearest edge
				const clampedX = Math.min(Math.max(e.clientX, imageRect.left), imageRect.right)
				const clampedY = Math.min(Math.max(e.clientY, imageRect.top), imageRect.bottom)

				// For edge-based zooming, calculate position relative to the image's center
				mouseX = clampedX - (imageRect.left + imageRect.width / 2)
				mouseY = clampedY - (imageRect.top + imageRect.height / 2)

				// Adjust the position to zoom towards the nearest edge
				const distanceToLeft = Math.abs(e.clientX - imageRect.left)
				const distanceToRight = Math.abs(e.clientX - imageRect.right)
				const distanceToTop = Math.abs(e.clientY - imageRect.top)
				const distanceToBottom = Math.abs(e.clientY - imageRect.bottom)

				// Find the nearest edge and adjust the zoom point
				const nearestX = distanceToLeft < distanceToRight ? imageRect.left : imageRect.right
				const nearestY = distanceToTop < distanceToBottom ? imageRect.top : imageRect.bottom

				mouseX = nearestX - (imageRect.left + imageRect.width / 2)
				mouseY = nearestY - (imageRect.top + imageRect.height / 2)
			} else {
				// When inside, zoom relative to the center
				mouseX = e.clientX - (imageRect.left + imageRect.width / 2)
				mouseY = e.clientY - (imageRect.top + imageRect.height / 2)
			}

			// Calculate new position to zoom towards mouse
			const scaleChange = newScale - scale
			const newPosition = {
				x: position.x - (mouseX * scaleChange),
				y: position.y - (mouseY * scaleChange)
			}

			// Keep image within container bounds
			const scaledWidth = imageRect.width * newScale
			const scaledHeight = imageRect.height * newScale

			// Calculate bounds to keep image filling the container
			const minX = Math.min(0, -(scaledWidth - containerRect.width) / 2)
			const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2)
			const minY = Math.min(0, -(scaledHeight - containerRect.height) / 2)
			const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2)

			// Clamp position within bounds
			const clampedPosition = {
				x: Math.min(maxX, Math.max(minX, newPosition.x)),
				y: Math.min(maxY, Math.max(minY, newPosition.y))
			}

			setScale(newScale)
			setPosition(clampedPosition)
		}

		// Add global mouse up handler to stop dragging even if released outside the image
		const handleGlobalMouseUp = () => {
			setIsDragging(false)
		}

		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('wheel', handleWheel, {passive: false})
		window.addEventListener('mouseup', handleGlobalMouseUp)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('wheel', handleWheel)
			window.removeEventListener('mouseup', handleGlobalMouseUp)
		}
	}, [hasNext, hasPrev, loading, onClose, scale, position])

	return (
		<div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl">
			<div className="absolute right-4 top-4 z-50 flex">
				{onDelete && (
					<Button
						variant="ghost"
						size="icon"
						onClick={handleDelete}
						className="hover:border-none"
					>
						<Trash2 className="h-4 w-4" />
						<span className="sr-only">Delete image</span>
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="hover:border-none"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</Button>
			</div>

			<div
				ref={containerRef}
				className="absolute inset-0 flex items-center justify-center p-4"
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={photo.id}
						initial={{opacity: 0, scale: 0.95}}
						animate={{opacity: 1, scale: 1}}
						exit={{opacity: 0, scale: 0.95}}
						transition={{duration: 0.15, ease: 'easeOut'}}
						className="relative max-h-full max-w-full"
						ref={imageRef}
					>
						{decryptedUrl ? (
							<div
								style={{
									transform: `scale(${scale})`,
									transformOrigin: '50% 50%',
									translate: `${position.x}px ${position.y}px`,
									transition: isDragging ? 'none' : 'transform 0.1s ease-out, translate 0.1s ease-out',
									cursor: scale > 1 ? 'grab' : 'default',
									...(isDragging && {cursor: 'grabbing'}),
									touchAction: 'none' // Prevent browser handling of touch events
								}}
								onMouseDown={handleMouseDown}
								onMouseMove={handleMouseMove}
								onMouseUp={handleMouseUp}
								onMouseLeave={handleMouseUp}
								onTouchStart={handleTouchStart}
								onTouchMove={handleTouchMove}
								onTouchEnd={handleTouchEnd}
								onTouchCancel={handleTouchEnd}
							>
								<Image
									src={decryptedUrl}
									alt={photo.originalFilename}
									width={photo.imageWidth || 1920}
									height={photo.imageHeight || 1080}
									className="max-h-[90vh] w-auto object-contain select-none"
									priority
									draggable={false}
								/>
							</div>
						) : (
							<div className="w-[1920px] h-[1080px] max-h-[90vh] bg-accent animate-pulse" />
						)}
					</motion.div>
				</AnimatePresence>

				{/* Navigation and zoom buttons */}
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50 p-1 rounded-full bg-background/50 backdrop-blur-md">
					<Button
						variant="ghost"
						size="icon"
						onClick={handlePrev}
						disabled={!hasPrev || loading}
						className="rounded-l-full hover:border-none"
					>
						<ChevronLeft className="h-4 w-4" />
						<span className="sr-only">Previous image</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleZoom(false)}
						disabled={scale === 1}
						className="hover:border-none"
					>
						<Minus className="h-4 w-4" />
						<span className="sr-only">Zoom out</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleZoom(true)}
						disabled={scale === 5}
						className="hover:border-none"
					>
						<Plus className="h-4 w-4" />
						<span className="sr-only">Zoom in</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleNext}
						disabled={!hasNext || loading}
						className="rounded-r-full hover:border-none"
					>
						<ChevronRight className="h-4 w-4" />
						<span className="sr-only">Next image</span>
					</Button>
				</div>
			</div>
		</div>
	)
}

export const LightboxProvider = ({children}: { children: React.ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null)
	const [hasNext, setHasNext] = useState(false)
	const [hasPrev, setHasPrev] = useState(false)
	const [onDeleteHandler, setOnDeleteHandler] = useState<(() => void) | undefined>(undefined)
	const [navigationHandlers, setNavigationHandlers] = useState<{
		onNext?:() => Promise<Photo | null>
		onPrev?: () => Promise<Photo | null>
			}>({})

	const openLightbox = useCallback((photo: Photo, hasNext = false, hasPrev = false, onDelete?: () => void) => {
		setCurrentPhoto(photo)
		setHasNext(hasNext)
		setHasPrev(hasPrev)
		setOnDeleteHandler(() => onDelete)
		setIsOpen(true)
	}, [])

	const closeLightbox = useCallback(() => {
		setIsOpen(false)
		setCurrentPhoto(null)
		setHasNext(false)
		setHasPrev(false)
		setOnDeleteHandler(undefined)
	}, [])

	const handleNext = async () => {
		if (!navigationHandlers.onNext) return null

		const nextPhoto = await navigationHandlers.onNext()
		if (nextPhoto) {
			setCurrentPhoto(nextPhoto)
			// Check if there's another photo after this one
			const futureNext = await navigationHandlers.onNext()
			// Reset the navigation handlers to avoid stale state
			setNavigationHandlers(prev => ({...prev}))
			setHasNext(!!futureNext)
			setHasPrev(true)
			return nextPhoto
		}

		setHasNext(false)
		return null
	}

	const handlePrev = async () => {
		if (!navigationHandlers.onPrev) return null

		const prevPhoto = await navigationHandlers.onPrev()
		if (prevPhoto) {
			setCurrentPhoto(prevPhoto)
			// Check if there's another photo before this one
			const futurePrev = await navigationHandlers.onPrev()
			// Reset the navigation handlers to avoid stale state
			setNavigationHandlers(prev => ({...prev}))
			setHasPrev(!!futurePrev)
			setHasNext(true)
			return prevPhoto
		}

		setHasPrev(false)
		return null
	}

	return (
		<LightboxContext.Provider
			value={{
				openLightbox,
				closeLightbox,
				onNext: navigationHandlers.onNext,
				onPrev: navigationHandlers.onPrev,
				setNavigationHandlers
			}}
		>
			{children}
			{isOpen && currentPhoto && (
				<Lightbox
					photo={currentPhoto}
					hasNext={hasNext}
					hasPrev={hasPrev}
					onClose={closeLightbox}
					onDelete={onDeleteHandler}
					onNext={handleNext}
					onPrev={handlePrev}
				/>
			)}
		</LightboxContext.Provider>
	)
}
