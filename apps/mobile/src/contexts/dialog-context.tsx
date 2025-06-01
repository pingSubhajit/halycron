import {createContext} from 'react'
import {Photo} from '@/src/lib/types'

// Dialog Context Interface
export interface DialogContextType {
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

	// Download Confirmation Sheet
	isDownloadConfirmationSheetOpen: boolean
	setDownloadConfirmationSheetOpen: (open: boolean) => void
	downloadConfirmationData: {
		photo: Photo | null
	}
	setDownloadConfirmationData: (data: { photo: Photo | null }) => void

	// Delete Confirmation Sheet
	isDeleteConfirmationSheetOpen: boolean
	setDeleteConfirmationSheetOpen: (open: boolean) => void
	deleteConfirmationData: {
		photo: Photo | null
		onPhotoDeleted?: (photo: Photo) => void
	}
	setDeleteConfirmationData: (data: { photo: Photo | null; onPhotoDeleted?: (photo: Photo) => void }) => void
}

// Create the context
export const DialogContext = createContext<DialogContextType | undefined>(undefined)
