'use client'

import React, {createContext, useCallback, useContext, useEffect, useState} from 'react'
import {Photo} from '@/app/api/photos/types'
import Image from 'next/image'
import {ChevronLeft, ChevronRight, Trash2, X} from 'lucide-react'
import {AnimatePresence, motion} from 'framer-motion'
import {downloadAndDecryptFile} from '@/app/api/photos/utils'
import {Button} from '@halycon/ui/components/button'

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
	const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		const decryptUrl = async () => {
			setDecryptedUrl(null) // Clear the current image while loading
			const url = await downloadAndDecryptFile(photo.url, photo.encryptedKey, photo.keyIv, photo.mimeType)
			setDecryptedUrl(url)
		}
		decryptUrl()
	}, [photo])

	const handleDelete = () => {
		onDelete?.()
		onClose()
	}

	const handleNext = async () => {
		if (!onNext || !hasNext || loading) return
		setLoading(true)
		const success = await onNext()
		setLoading(false)
	}

	const handlePrev = async () => {
		if (!onPrev || !hasPrev || loading) return
		setLoading(true)
		const success = await onPrev()
		setLoading(false)
	}

	// Handle keyboard navigation
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

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [hasNext, hasPrev, loading, onClose])

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

			<div className="absolute inset-0 flex items-center justify-center p-4">
				<AnimatePresence mode="wait">
					<motion.div
						key={photo.id}
						initial={{opacity: 0, scale: 0.95}}
						animate={{opacity: 1, scale: 1}}
						exit={{opacity: 0, scale: 0.95}}
						transition={{duration: 0.15, ease: 'easeOut'}}
						className="relative max-h-full max-w-full"
					>
						{decryptedUrl ? (
							<Image
								src={decryptedUrl}
								alt={photo.originalFilename}
								width={photo.imageWidth || 1920}
								height={photo.imageHeight || 1080}
								className="max-h-[90vh] w-auto object-contain"
								priority
							/>
						) : (
							<div className="w-[1920px] h-[1080px] max-h-[90vh] bg-accent animate-pulse" />
						)}
					</motion.div>
				</AnimatePresence>

				{/* Navigation buttons */}
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
					{/* <Button*/}
					{/*	variant="ghost"*/}
					{/*	size="icon"*/}
					{/*	onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}*/}
					{/*	disabled={scale <= 0.5}*/}
					{/* >*/}
					{/*	<ZoomOut className="h-4 w-4" />*/}
					{/*	<span className="sr-only">Zoom out</span>*/}
					{/* </Button>*/}
					{/* <Button*/}
					{/*	variant="ghost"*/}
					{/*	size="icon"*/}
					{/*	onClick={() => setScale((s) => Math.min(3, s + 0.25))}*/}
					{/*	disabled={scale >= 3}*/}
					{/* >*/}
					{/*	<ZoomIn className="h-4 w-4" />*/}
					{/*	<span className="sr-only">Zoom in</span>*/}
					{/* </Button>*/}
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
