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

		// Handle initial quick action that launched the app
		const initialAction = QuickActions.initial
		if (initialAction?.id === 'upload') {
			setUploadSource('manual')
			router.push('/(app)/upload')
		}

		// Handle quick actions while app is running
		const subscription = QuickActions.addListener(({id}) => {
			if (id === 'upload') {
				setUploadSource('manual')
				router.push('/(app)/upload')
			}
		})

		return () => subscription?.remove()
	}, [setUploadSource])
}
