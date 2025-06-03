import {useMutation, useQuery} from '@tanstack/react-query'
import {api} from '@/lib/data/api-client'

interface ProfilePictureUploadResponse {
	uploadUrl: string
	fileKey: string
}

interface ProfilePictureUpdateResponse {
	success: boolean
	user: {
		id: string
		name: string | null
		email: string
		image: string | null
		emailVerified: boolean
		createdAt: Date
	}
}

// Get presigned URL for profile picture upload
export const useProfilePictureUploadUrl = () => {
	return useMutation({
		mutationFn: async (data: { fileName: string; contentType: string }): Promise<ProfilePictureUploadResponse> => {
			return await api.post('/api/profile/picture', data)
		}
	})
}

// Update profile picture after successful upload
export const useUpdateProfilePicture = () => {
	return useMutation({
		mutationFn: async (data: { fileKey: string }): Promise<ProfilePictureUpdateResponse> => {
			return await api.patch('/api/profile/picture', data)
		}
	})
}

// Combined mutation for the complete upload flow
export const useUploadProfilePicture = () => {
	const getUploadUrl = useProfilePictureUploadUrl()
	const updateProfile = useUpdateProfilePicture()

	return useMutation({
		mutationFn: async (file: File) => {
			// Step 1: Get presigned URL
			const {uploadUrl, fileKey} = await getUploadUrl.mutateAsync({
				fileName: file.name,
				contentType: file.type
			})

			// Step 2: Upload file to S3
			const uploadResponse = await fetch(uploadUrl, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type,
					'x-amz-server-side-encryption': 'AES256'
				}
			})

			if (!uploadResponse.ok) {
				throw new Error('Failed to upload image to storage')
			}

			// Step 3: Update user profile with S3 file key
			const result = await updateProfile.mutateAsync({
				fileKey
			})

			return result.user
		}
	})
}

// Query hook to get profile picture URL
export const useProfilePictureUrl = (fileKey?: string | null) => {
	return useQuery({
		queryKey: ['profile-picture-url', fileKey],
		queryFn: async (): Promise<string | null> => {
			if (!fileKey) return null

			const response = await api.get<{ imageUrl: string | null }>('/api/profile/picture')
			return response.imageUrl
		},
		enabled: !!fileKey,
		staleTime: 55 * 60 * 1000, // 55 minutes (presigned URLs expire in 1 hour)
		gcTime: 60 * 60 * 1000 // 1 hour
	})
}
