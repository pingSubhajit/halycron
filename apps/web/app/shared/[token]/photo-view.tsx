'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Photo } from '@/app/api/photos/types'
import { Button } from '@halycron/ui/components/button'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { downloadAndDecryptFile } from '@/app/api/photos/utils'

export const PhotoView = ({ photo }: { photo: Photo }) => {
	const [scale, setScale] = useState(1)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
	const [pinchStart, setPinchStart] = useState<{ distance: number; scale: number } | null>(null)
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const imageRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// Decrypt the image
	useEffect(() => {
		const decryptImage = async () => {
			try {
				setIsLoading(true)
				if (photo.encryptedFileKey && photo.fileKeyIv) {
					const url = await downloadAndDecryptFile(
						photo.url,
						photo.encryptedFileKey,
						photo.fileKeyIv,
						photo.mimeType
					)
					setDecryptedUrl(url)
				} else {
					// For non-encrypted images
					setDecryptedUrl(photo.url)
				}
			} catch (error) {
				console.error('Failed to decrypt image:', error)
			} finally {
				setIsLoading(false)
			}
		}

		decryptImage()
	}, [photo])

	const handleZoom = (zoomIn: boolean) => {
		const zoomFactor = 0.25
		const newScale = Math.max(1, Math.min(3, scale + (zoomIn ? zoomFactor : -zoomFactor)))

		if (newScale === scale) return

		if (newScale === 1) {
			setScale(1)
			setPosition({ x: 0, y: 0 })
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
		setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
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
			setPinchStart({ distance, scale })
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
			const newScale = Math.max(1, Math.min(3, pinchStart.scale * pinchScale))

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

	// Handle wheel zoom
	useEffect(() => {
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault()

			if (!imageRef.current || !containerRef.current) return

			const imageRect = imageRef.current.getBoundingClientRect()
			const containerRect = containerRef.current.getBoundingClientRect()

			// Calculate zoom
			const delta = -e.deltaY
			const zoomFactor = 0.25
			const newScale = Math.max(1, Math.min(3, scale + (delta > 0 ? zoomFactor : -zoomFactor)))

			if (newScale === scale) return

			// If zooming out to scale 1, center the image
			if (newScale === 1) {
				setScale(1)
				setPosition({ x: 0, y: 0 })
				return
			}

			// Calculate mouse position relative to image center
			const mouseX = e.clientX - (imageRect.left + imageRect.width / 2)
			const mouseY = e.clientY - (imageRect.top + imageRect.height / 2)

			// Calculate new position to zoom towards mouse
			const scaleChange = newScale - scale
			const newPosition = {
				x: position.x - (mouseX * scaleChange),
				y: position.y - (mouseY * scaleChange)
			}

			// Calculate bounds
			const scaledWidth = imageRect.width * newScale
			const scaledHeight = imageRect.height * newScale
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

		window.addEventListener('wheel', handleWheel, { passive: false })
		window.addEventListener('mouseup', handleGlobalMouseUp)

		return () => {
			window.removeEventListener('wheel', handleWheel)
			window.removeEventListener('mouseup', handleGlobalMouseUp)
		}
	}, [scale, position])

	return (
		<div
			className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl touch-none"
			onTouchMove={(e) => e.preventDefault()}
			onTouchStart={(e) => {
				// Allow two-finger touch events for pinch zoom
				if (e.touches.length !== 2) {
					e.preventDefault()
				}
			}}
		>
			<div className="absolute right-4 top-4 z-50 flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => handleZoom(true)}
					className="hover:border-none"
					disabled={scale >= 3}
				>
					<ZoomIn className="h-4 w-4" />
					<span className="sr-only">Zoom in</span>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => handleZoom(false)}
					className="hover:border-none"
					disabled={scale <= 1}
				>
					<ZoomOut className="h-4 w-4" />
					<span className="sr-only">Zoom out</span>
				</Button>
			</div>

			<div
				ref={containerRef}
				className="absolute inset-0 flex items-center justify-center p-4"
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={photo.id}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.15, ease: 'easeOut' }}
						className="relative max-h-full max-w-full"
						ref={imageRef}
					>
						{isLoading ? (
							<div className="flex items-center justify-center w-full h-full">
								<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							</div>
						) : decryptedUrl ? (
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
								<img
									src={decryptedUrl}
									alt={photo.originalFilename || "Shared photo"}
									className="max-h-[90vh] max-w-full h-auto w-auto object-contain select-none"
									draggable={false}
								/>
							</div>
						) : (
							<div className="bg-muted p-8 rounded flex items-center justify-center">
								<p>Unable to display image</p>
							</div>
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	)
}
