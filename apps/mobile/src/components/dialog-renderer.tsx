import React, {useContext} from 'react'
import {DownloadConfirmationSheet, ExampleDialog, PhotoViewerSheet} from './dialogs'
import DeleteConfirmationSheet from './dialogs/delete-confirmation-sheet'
import ShareOptionsSheet from './dialogs/share-options-sheet'
import {DialogContext} from '@/src/contexts/dialog-context'

export const DialogRenderer: React.FC = () => {
	const context = useContext(DialogContext)

	if (!context) {
		return null
	}

	const {
		isExampleDialogOpen,
		setExampleDialogOpen,
		isPhotoViewerSheetOpen,
		setPhotoViewerSheetOpen,
		photoViewerData,
		isDownloadConfirmationSheetOpen,
		setDownloadConfirmationSheetOpen,
		downloadConfirmationData,
		isDeleteConfirmationSheetOpen,
		setDeleteConfirmationSheetOpen,
		deleteConfirmationData,
		isShareOptionsSheetOpen,
		setShareOptionsSheetOpen,
		shareOptionsData
	} = context

	return (
		<>
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

			<DownloadConfirmationSheet
				isOpen={isDownloadConfirmationSheetOpen}
				onClose={() => setDownloadConfirmationSheetOpen(false)}
				photo={downloadConfirmationData.photo}
			/>

			<DeleteConfirmationSheet
				isOpen={isDeleteConfirmationSheetOpen}
				onClose={() => setDeleteConfirmationSheetOpen(false)}
				photo={deleteConfirmationData.photo}
				onPhotoDeleted={deleteConfirmationData.onPhotoDeleted}
			/>

			<ShareOptionsSheet
				isOpen={isShareOptionsSheetOpen}
				onClose={() => setShareOptionsSheetOpen(false)}
				photo={shareOptionsData.photo}
			/>
		</>
	)
}
