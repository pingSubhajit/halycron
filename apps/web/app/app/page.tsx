'use client'

import {useEffect, useState} from 'react'
import Image from 'next/image'

// Dummy image data with various dimensions
type Image = { id: number, url: string, width: number, height: number }

const ImageSkeleton = () => (
	<div className="relative overflow-hidden rounded-lg bg-accent animate-pulse" style={{paddingBottom: '75%'}}>
		<div className="absolute inset-0" />
	</div>
)

const ApplicationHome = () => {
	const [loading, setLoading] = useState(true)
	const [images, setImages] = useState<Image[]>([])

	useEffect(() => {
		// Simulate loading delay
		const timer = setTimeout(async () => {
			const dummyImages = await (await fetch('https://api.unsplash.com/photos/random?count=20&client_id=1R1TrrTORi0nA7NhsfkSZINSdde4bbvnmzQTcsTDkdc')).json()

			setImages(dummyImages.map((image: { id: string, urls: {regular: string}, width: string, height: string }) => ({
				id: image.id,
				url: image.urls.regular,
				width: image.width,
				height: image.height
			})))
			setLoading(false)
		}, 2000)

		return () => clearTimeout(timer)
	}, [])

	return (
		<div>
			<div className="columns-1 gap-2 lg:gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>div:not(:first-child)]:mt-2 lg:[&>div:not(:first-child)]:mt-4">
				{loading
					? Array.from({length: 20}).map((_, index) => (
						<div key={`skeleton-${index}`} className="break-inside-avoid">
							<ImageSkeleton />
						</div>
					))
					: images.map((image) => (
						<div
							key={image.id}
							className="break-inside-avoid transition-transform hover:scale-[1.02] duration-200"
						>
							<div className="relative rounded-lg overflow-hidden">
								<Image
									src={image.url}
									alt={`Gallery image ${image.id}`}
									width={image.width}
									height={image.height}
									className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
								/>
							</div>
						</div>
					))}
			</div>
		</div>
	)
}

export default ApplicationHome
