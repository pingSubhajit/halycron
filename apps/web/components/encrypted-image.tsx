'use client'

import {Photo} from '@/app/api/photos/types'
import Image from 'next/image'
import {HTMLProps} from 'react'
import {cn} from '@halycron/ui/lib/utils'
import {useLightbox} from '@/components/lightbox-context'
import {useDecryptedUrl} from '@/hooks/use-decrypted-url'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '@halycron/ui/components/context-menu'
import {Download, Image as ImageIcon, Trash2} from 'lucide-react'
import {format} from 'date-fns'
import {AlbumSelector} from './album-selector'
import {ShareMenuItem} from '@/components/share/share-menu-item'

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

	const handleDownload = () => {
		if (!decryptedUrl) return

		// Create a temporary anchor element
		const a = document.createElement('a')
		a.href = decryptedUrl
		a.download = photo.originalFilename || 'encrypted-image.jpg'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<Image
					src={decryptedUrl}
					alt={photo.originalFilename}
					width={photo.imageWidth || 800}
					height={photo.imageHeight || 600}
					className="w-full h-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
					onClick={handleClick}
				/>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<div className="p-2">
					<p className="text-sm opacity-80">Uploaded on: {format(photo.createdAt || new Date(), 'MMM dd, yyyy')}</p>
					<p className="mt-0.5 text-xs opacity-60 font-bold">Secured using 256-bit AES-CBC key</p>
				</div>

				<ContextMenuSeparator />

				<ContextMenuItem className="flex items-center justify-between" onSelect={handleClick}>
					<span>View photo</span>
					<ImageIcon className="h-4 w-4" />
				</ContextMenuItem>
				<ContextMenuItem className="flex items-center justify-between" onSelect={handleDownload}>
					<span>Download</span>
					<Download className="h-4 w-4" />
				</ContextMenuItem>
				<ShareMenuItem photoIds={[photo.id]}>
					Share photo
				</ShareMenuItem>
				<AlbumSelector photo={photo} variant="context-menu" />
				<ContextMenuSeparator />
				<ContextMenuItem className="flex items-center justify-between" onSelect={onDelete}>
					<span>Delete photo</span>
					<Trash2 className="h-4 w-4" />
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

export default EncryptedImage
