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

		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('wheel', handleWheel, {passive: false})

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('wheel', handleWheel)
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
									transition: 'transform 0.1s ease-out, translate 0.1s ease-out'
								}}
							>
								<Image
									src={decryptedUrl}
									alt={photo.originalFilename}
									width={photo.imageWidth || 1920}
									height={photo.imageHeight || 1080}
									className="max-h-[90vh] w-auto object-contain"
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
