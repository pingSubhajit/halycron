import {Photo} from '@/app/api/photos/types'
import {Masonry} from 'masonic'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import useResponsive, {breakpoints} from '@/hooks/use-responsive'
import usePrevious from '@/hooks/use-previous'
import EncryptedImage from '@/components/encrypted-image'
import {useLightbox} from './lightbox-context'

type Props = {
	photos: Photo[]
	onDelete?: (photo: Photo) => void | Promise<void>
    currentAlbumId?: string
}

export const Gallery = ({photos, onDelete, currentAlbumId}: Props) => {
	const breakpoint = useResponsive()
	const [currentIndex, setCurrentIndex] = useState<number | null>(null)
	const {setNavigationHandlers} = useLightbox()

	const getNextPhoto = useCallback(async () => {
		const nextIndex = (currentIndex ?? 0) + 1
		if (nextIndex >= photos.length) return null
		setCurrentIndex(nextIndex)
		return photos[nextIndex] as Photo
	}, [currentIndex, photos])

	const getPrevPhoto = useCallback(async () => {
		const prevIndex = (currentIndex ?? 0) - 1
		if (prevIndex < 0) return null
		setCurrentIndex(prevIndex)
		return photos[prevIndex] as Photo
	}, [currentIndex, photos])

	// Set up navigation handlers at the gallery level
	useEffect(() => {
		if (currentIndex !== null) {
			setNavigationHandlers({
				onNext: getNextPhoto,
				onPrev: getPrevPhoto
			})
		}
	}, [getNextPhoto, getPrevPhoto, setNavigationHandlers, currentIndex])

	const prevItemsCount = usePrevious(photos.length)
	const removesCount = useRef(0)
	const addsCount = useRef(0)

	const gridKeyPostfix = useMemo(() => {
		if (!photos.length || !prevItemsCount) return `${removesCount.current}-${addsCount.current}`

		if (photos.length < prevItemsCount) {
			removesCount.current += 1
			addsCount.current = 0
			return `${removesCount.current}-${addsCount.current}`
		}

		if (photos.length > prevItemsCount) {
			addsCount.current += 1
			removesCount.current = 0
			return `${removesCount.current}-${addsCount.current}`
		}

		return `${removesCount.current}-${addsCount.current}`
	}, [photos.length, prevItemsCount])

	if (!photos.length) {
		return (
			<div className="flex flex-col items-center justify-center h-96">
				<p className="text-lg text-neutral-300">No photos here</p>
				<p className="text-sm text-neutral-500">Drag your photos here to upload</p>
			</div>
		)
	}

	return (
		<Masonry
			key={`gallery-${gridKeyPostfix}`}
			className="outline-0"
			items={photos}
			columnCount={breakpoint >= breakpoints['2xl'] ? 5 : breakpoint >= breakpoints.xl ? 4 : breakpoint >= breakpoints.lg ? 3 : 2}
			columnGutter={breakpoint >= breakpoints.xl ? 16 : breakpoint >= breakpoints.lg ? 10 : 8}
			itemKey={(_, index) => photos[index]!.id}
			render={
				({index}) => {
					const photo = photos[index]!
					const hasNext = index < photos.length - 1
					const hasPrev = index > 0

					return (
						<div
							className="break-inside-avoid hover:ring-2 hover:ring-primary transition duration-200 group relative"
						>
							<div className="relative overflow-hidden">
								<EncryptedImage
									photo={photo}
									hasNext={hasNext}
									hasPrev={hasPrev}
									onOpen={() => setCurrentIndex(index)}
									onDelete={() => onDelete?.(photo)}
									currentAlbumId={currentAlbumId}
								/>

								{onDelete && (
									<button
										onClick={(e) => {
											e.stopPropagation()
											onDelete(photo)
										}}
										className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
											viewBox="0 0 24 24"
											fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M3 6h18"></path>
											<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
											<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
										</svg>
									</button>
								)}
							</div>
						</div>
					)
				}
			}/>
	)
}
