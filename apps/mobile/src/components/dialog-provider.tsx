import React, {createContext, ReactNode, useContext, useState} from 'react'
import {ExampleDialog} from './dialogs'

// Dialog Context Interface
interface DialogContextType {
	// Example Dialog
	isExampleDialogOpen: boolean
	setExampleDialogOpen: (open: boolean) => void
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

	// Context value containing all dialog states and setters
	const contextValue: DialogContextType = {
		// Example Dialog
		isExampleDialogOpen,
		setExampleDialogOpen
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
