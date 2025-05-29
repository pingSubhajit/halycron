import React, {createContext, ReactNode, useContext} from 'react'
import {usePhotoUpload} from '@/src/hooks/use-photo-upload'
import * as ImagePicker from 'expo-image-picker'
import {Photo, UploadState} from '@/src/lib/types'

interface UploadContextType {
	uploadStates: Record<string, UploadState>
	showProgress: boolean
	setShowProgress: (show: boolean) => void
	selectAndUploadPhotos: () => Promise<void>
	uploadSharedPhotos: (assets: ImagePicker.ImagePickerAsset[]) => Promise<void>
	fileRejections: Array<{ fileName: string, error: string }>
	onProgressHoverChange: (isHovering: boolean) => void
	hasActiveUploads: boolean
}

const UploadContext = createContext<UploadContextType | null>(null)

interface UploadProviderProps {
	children: ReactNode
	onPhotoUploaded?: (photo: Photo) => void
}

export const UploadProvider: React.FC<UploadProviderProps> = ({
	children,
	onPhotoUploaded
}) => {
	const uploadHook = usePhotoUpload({
		onPhotoUploaded,
		showProgressInitially: false
	})

	const hasActiveUploads = Object.values(uploadHook.uploadStates).some(
		state => state.status === 'encrypting' || state.status === 'uploading'
	)

	const value: UploadContextType = {
		...uploadHook,
		hasActiveUploads
	}

	return (
		<UploadContext.Provider value={value}>
			{children}
		</UploadContext.Provider>
	)
}

export const useUploadContext = (): UploadContextType => {
	const context = useContext(UploadContext)
	if (!context) {
		throw new Error('useUploadContext must be used within an UploadProvider')
	}
	return context
}
