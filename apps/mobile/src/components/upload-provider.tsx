import React, {createContext, ReactNode, useCallback, useContext, useState} from 'react'
import {usePhotoUpload} from '@/src/hooks/use-photo-upload'
import * as ImagePicker from 'expo-image-picker'
import {Photo, UploadState} from '@/src/lib/types'

type UploadSource = 'manual' | 'share-intent' | 'notification'

interface UploadContextType {
	uploadStates: Record<string, UploadState>
	showProgress: boolean
	setShowProgress: (show: boolean) => void
	selectAndUploadPhotos: () => Promise<void>
	uploadSharedPhotos: (assets: ImagePicker.ImagePickerAsset[]) => Promise<void>
	fileRejections: Array<{ fileName: string, error: string }>
	onProgressHoverChange: (isHovering: boolean) => void
	hasActiveUploads: boolean
	uploadSource: UploadSource
	setUploadSource: (source: UploadSource) => void
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
	const [uploadSource, setUploadSource] = useState<UploadSource>('manual')

	const uploadHook = usePhotoUpload({
		onPhotoUploaded,
		showProgressInitially: false
	})

	const hasActiveUploads = Object.values(uploadHook.uploadStates).some(
		state => state.status === 'encrypting' || state.status === 'uploading'
	)

	// Enhanced uploadSharedPhotos that sets the source
	const uploadSharedPhotos = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
		setUploadSource('share-intent')
		return uploadHook.uploadSharedPhotos(assets)
	}, [uploadHook.uploadSharedPhotos])

	// Enhanced selectAndUploadPhotos that sets the source
	const selectAndUploadPhotos = useCallback(async () => {
		setUploadSource('manual')
		return uploadHook.selectAndUploadPhotos()
	}, [uploadHook.selectAndUploadPhotos])

	const value: UploadContextType = {
		...uploadHook,
		selectAndUploadPhotos,
		uploadSharedPhotos,
		hasActiveUploads,
		uploadSource,
		setUploadSource
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
