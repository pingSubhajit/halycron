'use client'

import {useEffect, useState} from 'react'
import {cn} from '@halycron/ui/lib/utils'
import {ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Share2} from 'lucide-react'
import {Button} from '@halycron/ui/components/button'
import {Carousel, CarouselApi, CarouselContent, CarouselItem} from '@halycron/ui/components/carousel'
import {AnimatePresence, motion} from 'motion/react'

interface LightboxProps {
	images: string[];
	currentIndex?: number;
	setCurrentIndex: (index: number) => void;
	onClose: () => void;
	onDelete?: () => void;
	onShare?: () => void;
	photoId?: string;
	isOpen: boolean;
	className?: string;
}

export const Lightbox = ({
	images,
	currentIndex = 0,
	setCurrentIndex,
	onClose,
	onDelete,
	onShare,
	photoId,
	isOpen,
	className
}: LightboxProps) => {
	const [scale, setScale] = useState(1)
	const [api, setApi] = useState<CarouselApi>()

	// Reset scale when image changes
	useEffect(() => {
		setScale(1)
		api?.scrollTo(currentIndex, true)
	}, [api, currentIndex])

	// Handle keyboard navigation
	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
			case 'Escape':
				onClose()
				break
			case 'ArrowLeft':
				if (setCurrentIndex) {
					setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : currentIndex)
				}
				break
			case 'ArrowRight':
				if (setCurrentIndex) {
					setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : currentIndex)
				}
				break
			default:
				break
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, images.length, onClose, setCurrentIndex, currentIndex])

	return (
		<div
			className={cn(
				'fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center',
				className
			)}
			onClick={(e) => e.stopPropagation()}
		>
			<AnimatePresence mode="wait">
				<motion.div
					initial={{opacity: 0, scale: 0.9}}
					animate={{opacity: 1, scale: 1}}
					exit={{opacity: 0, scale: 0.9}}
				>
					<Button
						variant="ghost"
						size="icon"
						className="absolute top-4 right-4 z-50"
						onClick={onClose}
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</Button>

					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-4 right-16 z-50"
							onClick={onDelete}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M3 6h18"></path>
								<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
								<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
							</svg>
							<span className="sr-only">Delete</span>
						</Button>
					)}

					{/* Controls */}
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50 p-1 rounded-full bg-background/50 backdrop-blur-md">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								if (setCurrentIndex) {
									api?.scrollPrev()
									setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : currentIndex)
								}
								setScale(1)
							}}
							disabled={currentIndex <= 0}
							className="rounded-l-full"
						>
							<ChevronLeft className="h-4 w-4" />
							<span className="sr-only">Previous image</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
							disabled={scale <= 0.5}
						>
							<ZoomOut className="h-4 w-4" />
							<span className="sr-only">Zoom out</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setScale((s) => Math.min(3, s + 0.25))}
							disabled={scale >= 3}
						>
							<ZoomIn className="h-4 w-4" />
							<span className="sr-only">Zoom in</span>
						</Button>
						{onShare && photoId && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onShare}
							>
								<Share2 className="h-4 w-4" />
								<span className="sr-only">Share image</span>
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								if (setCurrentIndex) {
									api?.scrollNext()
									setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : currentIndex)
								}
								setScale(1)
							}}
							disabled={currentIndex >= images.length - 1}
							className="rounded-r-full"
						>
							<ChevronRight className="h-4 w-4" />
							<span className="sr-only">Next image</span>
						</Button>
					</div>

					<Carousel setApi={setApi}>
						<CarouselContent>
							{images.map((image) => (
								<CarouselItem key={image}>
									<div className="h-screen p-8 flex justify-center items-center overflow-hidden">
										<img
											src={image}
											alt={`Image ${currentIndex + 1} of ${images.length}`}
											className="object-contain transition-transform duration-200 max-w-full max-h-full"
											style={{
												transform: `scale(${scale})`
											}}
										/>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>
				</motion.div>
			</AnimatePresence>
		</div>
	)
}
