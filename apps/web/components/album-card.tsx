'use client'

import {Album} from '@/app/api/albums/types'
import {useAlbumPhotos} from '@/app/api/albums/query'
import {Photo} from '@/app/api/photos/types'
import {useDecryptedUrl} from '@/hooks/use-decrypted-url'
import Image from 'next/image'
import {Image as ImageIcon} from 'lucide-react'
import {useCallback, useRef, useState} from 'react'
import Link from 'next/link'

const PhotoLayer = ({
	photo,
	style,
	zIndex,
	isTop,
	isStack,
	isAnimating
}: {
	photo: Photo
	style?: React.CSSProperties
	zIndex: number
	isTop: boolean
	isStack: boolean
	isAnimating: boolean
}) => {
	const decryptedUrl = useDecryptedUrl(photo)

	if (!decryptedUrl) {
		// return <div
		// 	className="relative overflow-hidden bg-accent animate-pulse w-full h-full min-h-48"
		// 	style={{aspectRatio: (photo.imageWidth || 800) / (photo.imageHeight || 600)}}
		// />

		return <></>
	}

	const getTransform = () => {
		const rotation = style?.transform || 'rotate(0deg)'
		const translateY = isStack && isAnimating ? '-16px' : '0'
		const translateX = isTop && isAnimating ? '120%' : '0'
		return `${rotation} translateY(${translateY}) translateX(${translateX})`
	}

	// Calculate dimensions to maintain aspect ratio while fitting container
	const aspectRatio = (photo.imageWidth || 4) / (photo.imageHeight || 3)
	const containerAspectRatio = 4 / 3 // matches the parent container's aspect ratio

	// Calculate the scale factor to fit the image within 90% of the container
	const scale = aspectRatio > containerAspectRatio
		? '90%' // width-constrained
		: '90%' // height-constrained

	return (
		<div
			style={{
				...style,
				zIndex,
				transform: getTransform(),
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
			}}
			className="absolute inset-0 flex items-center justify-center p-4"
		>
			<div
				className="relative w-full h-full flex items-center justify-center"
				style={{
					maxWidth: scale,
					maxHeight: scale
				}}
			>
				<Image
					src={decryptedUrl}
					alt={photo.originalFilename}
					width={photo.imageWidth || 800}
					height={photo.imageHeight || 600}
					className="rounded-lg shadow-lg object-contain"
					style={{
						maxWidth: '100%',
						maxHeight: '100%',
						width: 'auto',
						height: 'auto'
					}}
				/>
			</div>
		</div>
	)
}

export const AlbumCard = ({album}: {album: Album}) => {
	const {data: photos, isLoading, isError} = useAlbumPhotos(album.id)
	const [topPhotoIndex, setTopPhotoIndex] = useState(0)
	const [isAnimating, setIsAnimating] = useState(false)
	const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
	const rotationsRef = useRef<{ [key: number]: number }>({})

	const hasMultiplePhotos = photos && photos.length > 1

	const getRandomRotation = (index: number) => {
		if (rotationsRef.current[index] === undefined) {
			rotationsRef.current[index] = Math.random() * 10 - 5
		}
		return `rotate(${rotationsRef.current[index]}deg)`
	}

	const rotatePhotos = useCallback(() => {
		if (!hasMultiplePhotos) return

		setIsAnimating(true)

		setTimeout(() => {
			setTopPhotoIndex(current => (current + 1) % photos.length)
			setTimeout(() => {
				setIsAnimating(false)
			}, 50)
		}, 150)
	}, [hasMultiplePhotos, photos?.length])

	const startPhotoRotation = useCallback(() => {
		if (!hasMultiplePhotos) return

		rotatePhotos()
		hoverTimerRef.current = setInterval(rotatePhotos, 1000)
	}, [hasMultiplePhotos, rotatePhotos])

	const stopPhotoRotation = useCallback(() => {
		if (hoverTimerRef.current) {
			clearInterval(hoverTimerRef.current)
			hoverTimerRef.current = null
		}
		setIsAnimating(false)
	}, [])

	if (isLoading) {
		return <div className="relative overflow-hidden bg-accent animate-pulse w-full h-full aspect-[4/3]" />
	}

	return (
		<Link href={`/app/albums/${album.id}`}>
			<div className="w-full cursor-pointer">
				<div
					className="relative w-full aspect-[4/3] overflow-hidden"
					onMouseEnter={startPhotoRotation}
					onMouseLeave={stopPhotoRotation}
				>
					{photos && photos[0] && photos.map((photo, index) => {
						const effectiveIndex = (index - topPhotoIndex + photos.length) % photos.length
						const isTop = effectiveIndex === 0
						const isStack = effectiveIndex > 0

						return (
							<PhotoLayer
								key={photo.id}
								photo={photo}
								zIndex={photos.length - effectiveIndex}
								isTop={isTop}
								isStack={isStack}
								isAnimating={isAnimating}
								style={{
									transform: getRandomRotation(index)
								}}
							/>
						)
					})}

					{photos && photos.length === 0 && <div>
						<div className="absolute inset-0 flex items-center justify-center p-4">
							<ImageIcon className="w-36 h-36 text-muted-foreground opacity-80"/>
						</div>
					</div>}
				</div>

				<p className="text-center m-auto font-semibold text-muted-foreground">{album.name}</p>
			</div>
		</Link>
	)
}

export default AlbumCard
