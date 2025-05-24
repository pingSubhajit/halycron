import React, {createContext, ReactNode, useContext, useState} from 'react'
import {ExampleDialog, PhotoViewerSheet} from './dialogs'
import {Photo} from '@/src/lib/types'

// Dialog Context Interface
interface DialogContextType {
	// Example Dialog
	isExampleDialogOpen: boolean
	setExampleDialogOpen: (open: boolean) => void

	// Photo Viewer Sheet
	isPhotoViewerSheetOpen: boolean
	setPhotoViewerSheetOpen: (open: boolean) => void
	photoViewerData: {
		initialPhoto: Photo | null
	}
	setPhotoViewerData: (data: { initialPhoto: Photo | null }) => void
}

// Create the context
const DialogContext = createContext<DialogContextType | undefined>(undefined)

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

	// Context value containing all dialog states and setters
	const contextValue: DialogContextType = {
		// Example Dialog
		isExampleDialogOpen,
		setExampleDialogOpen,

		// Photo Viewer Sheet
		isPhotoViewerSheetOpen,
		setPhotoViewerSheetOpen,
		photoViewerData,
		setPhotoViewerData
	}

	return (
		<DialogContext.Provider value={contextValue}>
			{/* Render children (app content) */}
			{children}

			{/* Render all dialogs - they are always mounted but controlled by state */}
			<ExampleDialog
				isOpen={isExampleDialogOpen}
				onClose={() => setExampleDialogOpen(false)}
			/>

			<PhotoViewerSheet
				isOpen={isPhotoViewerSheetOpen}
				onClose={() => setPhotoViewerSheetOpen(false)}
				initialPhoto={photoViewerData.initialPhoto}
			/>

			{/* Future dialogs can be added here following the same pattern */}
		</DialogContext.Provider>
	)
}

// Hook to access the dialog context
const useDialogContext = (): DialogContextType => {
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

/*
 * Example of how to add more dialog hooks:
 *
 * export const useConfirmationDialog = () => {
 * 	const {isConfirmationDialogOpen, setConfirmationDialogOpen} = useDialogContext()
 * 	return {
 * 		isConfirmationDialogOpen,
 * 		setConfirmationDialogOpen,
 * 	}
 * }
 */
