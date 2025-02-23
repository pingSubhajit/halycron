'use client'

import {Photo} from '@/app/api/photos/types'
import Image from 'next/image'
import {HTMLProps} from 'react'
import {cn} from '@halycon/ui/lib/utils'
import {useLightbox} from './lightbox-context'
import {useDecryptedUrl} from '@/hooks/use-decrypted-url'
import {TextShimmer} from '@halycon/ui/components/text-shimmer'

type Props = {
	photo: Photo
	hasNext?: boolean
	hasPrev?: boolean
	onOpen?: () => void
	onDelete?: () => void
}

const ImageSkeleton = (props: HTMLProps<HTMLDivElement>) => (
	<div className={cn('relative overflow-hidden bg-accent animate-pulse w-full h-full', props.className)} style={{paddingBottom: '75%', ...props.style}} {...props}>
		<div className="absolute inset-0" />
		<TextShimmer duration={1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-sm">
			Decrypting . . .
		</TextShimmer>
	</div>
)

export const EncryptedImage = ({photo, hasNext, hasPrev, onOpen, onDelete}: Props) => {
	const decryptedUrl = useDecryptedUrl(photo)
	const {openLightbox} = useLightbox()

	if (!decryptedUrl) {
		return <ImageSkeleton style={{
			aspectRatio: `${photo.imageWidth || 800}/${photo.imageHeight || 600}`
		}} />
	}

	const handleClick = () => {
		onOpen?.()
		openLightbox(photo, hasNext, hasPrev, onDelete)
	}

	return (
		<Image
			src={decryptedUrl}
			alt={photo.originalFilename}
			width={photo.imageWidth || 800}
			height={photo.imageHeight || 600}
			className="w-full h-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
			onClick={handleClick}
		/>
	)
}

export default EncryptedImage
