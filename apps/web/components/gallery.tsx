import Image from 'next/image'
import {Photo} from '@/app/api/photos/types'
import {Masonry} from 'masonic'
import {HTMLProps} from 'react'
import {cn} from '@halycon/ui/lib/utils'

type Props = {
	photos: Photo[]
	onClick: (photo: Photo, index: number) => void
	onDelete?: (photo: Photo) => Promise<void>
	totalPhotos: number
	loaded: number
	dimensions: {width: number, height: number}[]
}

const ImageSkeleton = (props: HTMLProps<HTMLDivElement>) => (
	<div className={cn('relative overflow-hidden bg-accent animate-pulse w-full h-full', props.className)} style={{paddingBottom: '75%', ...props.style}} {...props}>
		<div className="absolute inset-0" />
	</div>
)

export const Gallery = ({photos, onClick, onDelete, totalPhotos, loaded, dimensions}: Props) => {
	// const breakpoint = useResponsive()

	return (
		<Masonry items={Array.from(Array(totalPhotos), () => ({id: 1}))} columnCount={4
			/*
			 * breakpoint >= breakpoints.xl ? 4 :
			 * 	breakpoint >= breakpoints.lg ? 3 :
			 * 		breakpoint >= breakpoints.sm ? 2 : 1
			 */
		} columnGutter={16} render={
			({index}) => {
				if (index >= loaded) {
					return <ImageSkeleton style={{
						aspectRatio: `${dimensions[index]?.width || 800}/${dimensions[index]?.height || 600}`
					}} />
				}

				const photo = photos[index]!

				return (
					<div
						key={photo.id}
						className="break-inside-avoid hover:ring-2 hover:ring-primary transition duration-200 group relative"
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
