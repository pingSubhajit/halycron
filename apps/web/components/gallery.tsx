import Image from 'next/image'

export type Photo = {
	id: string
	url: string
	originalFilename: string
	createdAt: string
}

type Props = {
	photos: Photo[]
	onClick: (photo: Photo, index: number) => void
	totalPhotos: number
	loaded: number
}

const ImageSkeleton = () => (
	<div className="relative overflow-hidden rounded-lg bg-accent animate-pulse" style={{paddingBottom: '75%'}}>
		<div className="absolute inset-0" />
	</div>
)

export const Gallery = ({photos, onClick, totalPhotos, loaded}: Props) => {
	return (
		<div className="columns-1 gap-2 lg:gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>div:not(:first-child)]:mt-2 lg:[&>div:not(:first-child)]:mt-4">
			{photos.map((photo, index) => (
				<div
					key={photo.id}
					className="break-inside-avoid transition-transform hover:scale-[1.02] duration-200"
					onClick={() => onClick(photo, index)}
				>
					<div className="relative rounded-lg overflow-hidden">
						<Image
							src={photo.url}
							alt={photo.originalFilename}
							width={800}
							height={600}
							className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
						/>
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
