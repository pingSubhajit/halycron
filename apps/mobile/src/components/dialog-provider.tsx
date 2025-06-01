import React, {ReactNode, useContext, useState} from 'react'
import {DialogContext, DialogContextType} from '@/src/contexts/dialog-context'
import {Photo} from '@/src/lib/types'

// Dialog Provider Props
interface DialogProviderProps {
	children: ReactNode
}

// Dialog Provider Component
export const DialogProvider: React.FC<DialogProviderProps> = ({children}) => {
	// State for Example Dialog
	const [isExampleDialogOpen, setExampleDialogOpen] = useState(false)

	// State for Photo Viewer Sheet
	const [isPhotoViewerSheetOpen, setPhotoViewerSheetOpen] = useState(false)
	const [photoViewerData, setPhotoViewerData] = useState<{
		initialPhoto: Photo | null
	}>({
		initialPhoto: null
	})

	// State for Download Confirmation Sheet
	const [isDownloadConfirmationSheetOpen, setDownloadConfirmationSheetOpen] = useState(false)
	const [downloadConfirmationData, setDownloadConfirmationData] = useState<{
		photo: Photo | null
	}>({
		photo: null
	})

	// State for Delete Confirmation Sheet
	const [isDeleteConfirmationSheetOpen, setDeleteConfirmationSheetOpen] = useState(false)
	const [deleteConfirmationData, setDeleteConfirmationData] = useState<{
		photo: Photo | null
		onPhotoDeleted?:(photo: Photo) => void
			}>({
				photo: null,
				onPhotoDeleted: undefined
			})

	// Context value containing all dialog states and setters
	const contextValue: DialogContextType = {
		// Example Dialog
		isExampleDialogOpen,
		setExampleDialogOpen,

		// Photo Viewer Sheet
		isPhotoViewerSheetOpen,
		setPhotoViewerSheetOpen,
		photoViewerData,
		setPhotoViewerData,

		// Download Confirmation Sheet
		isDownloadConfirmationSheetOpen,
		setDownloadConfirmationSheetOpen,
		downloadConfirmationData,
		setDownloadConfirmationData,

		// Delete Confirmation Sheet
		isDeleteConfirmationSheetOpen,
		setDeleteConfirmationSheetOpen,
		deleteConfirmationData,
		setDeleteConfirmationData
	}

	return (
		<DialogContext.Provider value={contextValue}>
			{/* Render children (app content) */}
			{children}
		</DialogContext.Provider>
	)
}

// Hook to access the dialog context
const useDialogContext = () => {
	const context = useContext(DialogContext)
	if (context === undefined) {
		throw new Error('useDialogContext must be used within a DialogProvider')
	}
	return context
}

// Individual dialog hooks - these are what you'll use throughout your app

/**
 * Hook to control the Example Dialog
 * Returns the open state and setter function
 *
 * Usage:
 * const { isExampleDialogOpen, setExampleDialogOpen } = useExampleDialog()
 *
 * // To open the dialog
 * setExampleDialogOpen(true)
 *
 * // To close the dialog
 * setExampleDialogOpen(false)
 */
export const useExampleDialog = () => {
	const {isExampleDialogOpen, setExampleDialogOpen} = useDialogContext()
	return {
		isExampleDialogOpen,
		setExampleDialogOpen
	}
}

/**
 * Hook to control the Photo Viewer Sheet
 * Returns the open state, setter function, and methods to manage photo data
 *
 * Usage:
 * const { openPhotoViewer, closePhotoViewer } = usePhotoViewer()
 *
 * // To open the photo viewer with a specific photo
 * openPhotoViewer(photo)
 *
 * // To close the photo viewer
 * closePhotoViewer()
 */
export const usePhotoViewer = () => {
	const {
		isPhotoViewerSheetOpen,
		setPhotoViewerSheetOpen,
		photoViewerData,
		setPhotoViewerData
	} = useDialogContext()

	const openPhotoViewer = (photo: Photo) => {
		setPhotoViewerData({initialPhoto: photo})
		setPhotoViewerSheetOpen(true)
	}

	const closePhotoViewer = () => {
		setPhotoViewerSheetOpen(false)
		// Clear data after a short delay to allow closing animation
		setTimeout(() => {
			setPhotoViewerData({initialPhoto: null})
		}, 300)
	}

	return {
		isPhotoViewerSheetOpen,
		photoViewerData,
		openPhotoViewer,
		closePhotoViewer
	}
}

/**
 * Hook to control the Download Confirmation Sheet
 * Returns methods to open and close the download confirmation dialog
 *
 * Usage:
 * const { openDownloadConfirmation, closeDownloadConfirmation } = useDownloadConfirmation()
 *
 * // To open the download confirmation with a specific photo
 * openDownloadConfirmation(photo)
 *
 * // To close the download confirmation
 * closeDownloadConfirmation()
 */
export const useDownloadConfirmation = () => {
	const {
		isDownloadConfirmationSheetOpen,
		setDownloadConfirmationSheetOpen,
		downloadConfirmationData,
		setDownloadConfirmationData
	} = useDialogContext()

	const openDownloadConfirmation = (photo: Photo) => {
		setDownloadConfirmationData({photo})
		setDownloadConfirmationSheetOpen(true)
	}

	const closeDownloadConfirmation = () => {
		setDownloadConfirmationSheetOpen(false)
		// Clear data after a short delay to allow closing animation
		setTimeout(() => {
			setDownloadConfirmationData({photo: null})
		}, 300)
	}

	return {
		isDownloadConfirmationSheetOpen,
		downloadConfirmationData,
		openDownloadConfirmation,
		closeDownloadConfirmation
	}
}

/**
 * Hook to control the Delete Confirmation Sheet
 * Returns methods to open and close the delete confirmation dialog
 *
 * Usage:
 * const { openDeleteConfirmation, closeDeleteConfirmation } = useDeleteConfirmation()
 *
 * // To open the delete confirmation with a specific photo
 * openDeleteConfirmation(photo)
 *
 * // To close the delete confirmation
 * closeDeleteConfirmation()
 */
export const useDeleteConfirmation = () => {
	const {
		isDeleteConfirmationSheetOpen,
		setDeleteConfirmationSheetOpen,
		deleteConfirmationData,
		setDeleteConfirmationData
	} = useDialogContext()

	const openDeleteConfirmation = (photo: Photo, onPhotoDeleted?: (photo: Photo) => void) => {
		setDeleteConfirmationData({photo, onPhotoDeleted})
		setDeleteConfirmationSheetOpen(true)
	}

	const closeDeleteConfirmation = () => {
		setDeleteConfirmationSheetOpen(false)
		// Clear data after a short delay to allow closing animation
		setTimeout(() => {
			setDeleteConfirmationData({photo: null, onPhotoDeleted: undefined})
		}, 300)
	}

	return {
		isDeleteConfirmationSheetOpen,
		deleteConfirmationData,
		openDeleteConfirmation,
		closeDeleteConfirmation
	}
}
