import {Photo} from './types'
import {api} from './api-client'

export interface DeleteResult {
	success: boolean
	message: string
	deletedPhoto?: Photo
}

export const deletePhoto = async (photo: Photo): Promise<DeleteResult> => {
	try {
		// Make DELETE request to the API
		const response = await api.delete<Photo>('/api/photos', {
			body: {photoId: photo.id}
		})

		return {
			success: true,
			message: 'Photo deleted successfully!',
			deletedPhoto: response
		}
	} catch (error) {
		let errorMessage = 'Failed to delete photo.'

		if (error instanceof Error) {
			// Provide more specific error messages
			if (error.message.includes('Network')) {
				errorMessage = 'Failed to delete photo. Please check your internet connection.'
			} else if (error.message.includes('404')) {
				errorMessage = 'Photo not found. It may have already been deleted.'
			} else if (error.message.includes('403')) {
				errorMessage = 'You do not have permission to delete this photo.'
			} else {
				errorMessage = `Delete failed: ${error.message}`
			}
		}

		return {
			success: false,
			message: errorMessage
		}
	}
}
