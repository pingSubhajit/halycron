import Image from 'next/image'

export type Photo = {
	id: string
	url: string
	originalFilename: string
	createdAt: string
	encryptedKey: string
	keyIv: string
	mimeType: string
	imageWidth?: number
	imageHeight?: number
}

type Props = {
	photos: Photo[]
	onClick: (photo: Photo, index: number) => void
	onDelete?: (photo: Photo) => Promise<void>
	totalPhotos: number
	loaded: number
}

const ImageSkeleton = () => (
	<div className="relative overflow-hidden rounded-lg bg-accent animate-pulse" style={{paddingBottom: '75%'}}>
		<div className="absolute inset-0" />
	</div>
)

export const Gallery = ({photos, onClick, onDelete, totalPhotos, loaded}: Props) => {
	return (
		<div className="columns-1 gap-2 lg:gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>div:not(:first-child)]:mt-2 lg:[&>div:not(:first-child)]:mt-4">
			{photos.map((photo, index) => (
				<div
					key={photo.id}
					className="break-inside-avoid hover:border-2 hover:border-primary transition duration-200 group relative"
				>
					<div className="relative overflow-hidden">
						<Image
							src={photo.url}
							alt={photo.originalFilename}
							width={photo.imageWidth || 800}
							height={photo.imageHeight || 600}
							className="w-full h-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
							onClick={() => onClick(photo, index)}
						/>
						{onDelete && (
							<button
								onClick={(e) => {
									e.stopPropagation()
									onDelete(photo)
								}}
								className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M3 6h18"></path>
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
								</svg>
							</button>
						)}
					</div>
				</div>
			))}

			{Array.from({length: totalPhotos - loaded}).map((_, index) => (
				<div key={`skeleton-${index}`} className="break-inside-avoid">
					<ImageSkeleton/>
				</div>
			))}
		</div>
	)
}
