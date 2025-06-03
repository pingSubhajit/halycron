'use client'

import {Avatar, AvatarFallback, AvatarImage} from '@halycron/ui/components/avatar'
import {User} from 'lucide-react'
import {useProfilePictureUrl} from '@/app/api/profile/picture/mutations'
import {cn} from '@halycron/ui/lib/utils'

interface ProfilePictureProps {
	userImage?: string | null
	userEmail?: string
	userName?: string
	className?: string
	fallbackClassName?: string
}

export const ProfilePicture = ({
	userImage,
	userEmail,
	userName,
	className,
	fallbackClassName
}: ProfilePictureProps) => {
	// If userImage looks like an S3 key (no http), fetch presigned URL
	const isS3Key = userImage && !userImage.startsWith('http')
	const {data: presignedUrl} = useProfilePictureUrl(isS3Key ? userImage : null)

	// Determine the image URL to use
	const imageUrl = isS3Key
		? presignedUrl
		: userImage || (userEmail
			? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userEmail)}`
			: undefined)

	return (
		<Avatar className={cn('rounded-none', className)}>
			<AvatarImage
				src={imageUrl || undefined}
				alt={userName || 'Profile picture'}
			/>
			<AvatarFallback className={cn(fallbackClassName)}>
				<User className="h-4 w-4"/>
			</AvatarFallback>
		</Avatar>
	)
}
