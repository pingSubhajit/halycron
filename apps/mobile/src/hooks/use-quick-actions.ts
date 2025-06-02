import {useEffect} from 'react'
import {router} from 'expo-router'
import {Platform} from 'react-native'
import * as QuickActions from 'expo-quick-actions'
import {useUploadContext} from '@/src/components/upload-provider'

export const useQuickActions = () => {
	const {setUploadSource} = useUploadContext()

	useEffect(() => {
		// Set up quick actions dynamically
		const setupQuickActions = async () => {
			try {
				await QuickActions.setItems([
					{
						id: 'upload',
						title: 'Upload Photos',
						subtitle: 'Quickly upload secure photos',
						// Use custom icon on Android, SF Symbol on iOS
						icon: Platform.OS === 'android' ? 'upload' : 'symbol:photo.badge.plus'
					}
				])
			} catch (error) {
				console.warn('Failed to set quick actions:', error)
			}
		}

		setupQuickActions()

		// Check if app was initially opened via quick action and set upload source
		const initialAction = QuickActions.initial
		if (initialAction?.id === 'upload') {
			setUploadSource('manual')
		}

		/*
		 * Only handle quick actions while app is running (not initial launch)
		 * Initial quick actions are handled in session provider for proper routing after auth
		 */
		const subscription = QuickActions.addListener(({id}) => {
			if (id === 'upload') {
				setUploadSource('manual')
				router.push('/(app)/upload')
			}
		})

		return () => subscription?.remove()
	}, [setUploadSource])
}
