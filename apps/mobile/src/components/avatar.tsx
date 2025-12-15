import React from 'react'
import {Image, View} from 'react-native'

interface AvatarProps {
	imageUrl?: string
	fallback?: React.ReactNode
	size?: number
	className?: string
	rounded?: boolean
	isLoading?: boolean
}

export const Avatar = ({
	imageUrl,
	fallback,
	size = 40,
	className = '',
	rounded = false,
	isLoading = false
}: AvatarProps) => {
	const [imageError, setImageError] = React.useState(false)

	// Reset error state when imageUrl changes
	React.useEffect(() => {
		setImageError(false)
	}, [imageUrl])

	return (
		<View
			className={`bg-muted justify-center items-center overflow-hidden ${className}`}
			style={{
				width: size,
				height: size
			}}
		>
			{isLoading ? (
				fallback || null
			) : imageUrl && !imageError ? (
				<Image
					source={{
						uri: imageUrl,
						cache: 'force-cache' // Use aggressive caching
					}}
					style={{width: size, height: size}}
					onError={() => setImageError(true)}
				/>
			) : (
				fallback || null
			)}
		</View>
	)
}
