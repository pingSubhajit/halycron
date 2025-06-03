import React from 'react'
import {Avatar} from './avatar'
import {Feather} from '@expo/vector-icons'
import {useProfilePictureUrl} from '../hooks/use-profile-picture'

interface ProfilePictureProps {
	userImage?: string | null
	userEmail?: string
	size?: number
	className?: string
	fallback?: React.ReactNode
}

export const ProfilePicture = ({
	userImage,
	userEmail,
	size = 40,
	className = '',
	fallback
}: ProfilePictureProps) => {
	// If userImage looks like an S3 key (no http), fetch presigned URL
	const isS3Key = userImage && !userImage.startsWith('http')
	const {data: presignedUrl} = useProfilePictureUrl(isS3Key ? userImage : null)

	// Determine the image URL to use
	const imageUrl = isS3Key
		? presignedUrl
		: userImage || (userEmail
			? `https://api.dicebear.com/7.x/thumbs/png?seed=${encodeURIComponent(userEmail)}&size=128`
			: undefined)

	return (
		<Avatar
			imageUrl={imageUrl as string | undefined}
			fallback={fallback || <Feather name="user" size={Math.floor(size * 0.5)} color="#fff"/>}
			size={size}
			className={className}
		/>
	)
}
