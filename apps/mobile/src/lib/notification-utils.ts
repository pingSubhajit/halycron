import * as Notifications from 'expo-notifications'
import {Platform} from 'react-native'

// Configure notification behavior
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
		shouldShowList: true
	})
})

interface UploadProgress {
	fileName: string
	progress: number
	status: 'idle' | 'encrypting' | 'uploading' | 'uploaded' | 'error'
}

export class UploadNotificationManager {
	private static instance: UploadNotificationManager

	private permissionGranted: boolean = false

	private static readonly UPLOAD_NOTIFICATION_ID = 'upload-progress-notification' // Fixed ID

	private activeUploads: Map<string, UploadProgress> = new Map() // fileName -> progress info

	private uploadSessionActive: boolean = false

	private updateTimeout: NodeJS.Timeout | null = null

	static getInstance(): UploadNotificationManager {
		if (!UploadNotificationManager.instance) {
			UploadNotificationManager.instance = new UploadNotificationManager()
		}
		return UploadNotificationManager.instance
	}

	async initialize(): Promise<boolean> {
		try {
			// Request permissions
			const {status: existingStatus} = await Notifications.getPermissionsAsync()
			let finalStatus = existingStatus

			if (existingStatus !== 'granted') {
				const {status} = await Notifications.requestPermissionsAsync()
				finalStatus = status
			}

			this.permissionGranted = finalStatus === 'granted'

			if (!this.permissionGranted) {
				console.warn('Notification permissions not granted')
				return false
			}

			// Configure notification channel for Android with progress support
			if (Platform.OS === 'android') {
				await Notifications.setNotificationChannelAsync('upload-progress', {
					name: 'Photo Upload Progress',
					importance: Notifications.AndroidImportance.LOW, // LOW to prevent heads-up
					vibrationPattern: [0],
					lightColor: '#3b82f6',
					showBadge: false,
					enableVibrate: false
				})
			}

			return true
		} catch (error) {
			console.error('Failed to initialize notifications:', error)
			return false
		}
	}

	async startUploadSession(totalFiles: number): Promise<void> {
		if (!this.permissionGranted) return

		// Prevent starting multiple sessions
		if (this.uploadSessionActive) {
			return
		}

		this.uploadSessionActive = true
		this.activeUploads.clear()

		try {
			// Cancel any existing notification with the same ID
			await this.cancelCurrentNotification()

			await this.showProgressNotification(
				'Preparing to upload',
				totalFiles === 1
					? 'Preparing to upload 1 photo securely...'
					: `Preparing to upload ${totalFiles} photos securely...`,
				0,
				100,
				false // indeterminate initially
			)
		} catch (error) {
			console.error('Failed to start upload session notification:', error)
		}
	}

	private async showProgressNotification(
		title: string,
		body: string,
		progress: number,
		maxProgress: number,
		isIndeterminate: boolean = false
	): Promise<void> {
		const notificationContent: any = {
			title: `📸 ${title}`,
			body,
			data: {
				type: 'upload-progress',
				progress,
				maxProgress
			},
			categoryIdentifier: 'upload',
			sticky: true
		}

		// Add Android-specific progress bar
		if (Platform.OS === 'android') {
			notificationContent.android = {
				channelId: 'upload-progress',
				progress: {
					max: maxProgress,
					current: progress,
					indeterminate: isIndeterminate
				},
				ongoing: true, // Makes notification non-dismissible
				autoCancel: false,
				showWhen: true,
				priority: 'low',
				visibility: 'public'
			}
		}

		await Notifications.scheduleNotificationAsync({
			identifier: UploadNotificationManager.UPLOAD_NOTIFICATION_ID,
			content: notificationContent,
			trigger: null
		})
	}

	async updateFileProgress(fileName: string, progress: number, status: 'idle' | 'encrypting' | 'uploading' | 'uploaded' | 'error'): Promise<void> {
		if (!this.permissionGranted || !this.uploadSessionActive) return

		// Update the progress for this file
		this.activeUploads.set(fileName, {fileName, progress, status})

		// Clear any existing timeout
		if (this.updateTimeout) {
			clearTimeout(this.updateTimeout)
		}

		// Debounce updates to prevent rapid-fire notifications
		this.updateTimeout = setTimeout(async () => {
			await this.updateCombinedProgress()
		}, 200) // Increased debounce for Android
	}

	private async updateCombinedProgress(): Promise<void> {
		if (!this.uploadSessionActive) return

		const uploads = Array.from(this.activeUploads.values())
		const totalFiles = uploads.length

		if (totalFiles === 0) return

		// Calculate overall progress
		const totalProgress = uploads.reduce((sum, upload) => {
			// Give different weights to different statuses
			switch (upload.status) {
			case 'idle':
				return sum + 0
			case 'encrypting':
				return sum + (upload.progress * 0.3) // Encryption is ~30% of total
			case 'uploading':
				return sum + 30 + (upload.progress * 0.7) // Upload is ~70% of total
			case 'uploaded':
				return sum + 100
			case 'error':
				return sum + 0
			default:
				return sum
			}
		}, 0)

		const averageProgress = Math.round(totalProgress / totalFiles)

		// Count statuses
		const completed = uploads.filter(u => u.status === 'uploaded' || u.status === 'error').length
		const errors = uploads.filter(u => u.status === 'error').length
		const encrypting = uploads.filter(u => u.status === 'encrypting').length
		const uploading = uploads.filter(u => u.status === 'uploading').length

		// Determine primary status and message
		let title: string
		let body: string

		if (encrypting > 0) {
			title = 'Encrypting Photos'
			body = `🔐 Encrypting ${encrypting} photo${encrypting > 1 ? 's' : ''} securely...`
		} else if (uploading > 0) {
			title = 'Uploading Photos'
			body = `📤 Uploading ${uploading} photo${uploading > 1 ? 's' : ''}...`
		} else if (completed === totalFiles) {
			// All done - will be handled by completion method
			return
		} else {
			title = 'Processing Photos'
			body = `⏳ Processing ${totalFiles} photo${totalFiles > 1 ? 's' : ''}...`
		}

		try {
			await this.showProgressNotification(title, body, averageProgress, 100, false)
		} catch (error) {
			console.error('Failed to update combined progress:', error)
		}
	}

	async showUploadCompleted(successCount: number, totalCount: number): Promise<void> {
		if (!this.permissionGranted) return

		// End the upload session
		this.uploadSessionActive = false

		try {
			const isAllSuccess = successCount === totalCount
			const title = isAllSuccess ? 'Upload Complete' : 'Upload Finished'
			const body = isAllSuccess
				? `${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully!`
				: `${successCount}/${totalCount} photos uploaded successfully`

			// Update the same notification instead of creating a new one
			const notificationContent: any = {
				title: `✅ ${title}`,
				body,
				data: {type: 'upload-complete', successCount, totalCount},
				categoryIdentifier: 'upload-complete',
				sticky: false // Allow dismissal now
			}

			// Update Android notification to remove progress bar and make it dismissible
			if (Platform.OS === 'android') {
				notificationContent.android = {
					channelId: 'upload-progress',
					autoCancel: true, // Now dismissible
					ongoing: false, // No longer ongoing
					priority: 'default',
					visibility: 'public'
					// No progress bar for completion
				}
			}

			await Notifications.scheduleNotificationAsync({
				identifier: UploadNotificationManager.UPLOAD_NOTIFICATION_ID, // Same ID!
				content: notificationContent,
				trigger: null
			})

			// Clear session data
			this.activeUploads.clear()
		} catch (error) {
			console.error('Failed to show completion notification:', error)
		}
	}

	private async cancelCurrentNotification(): Promise<void> {
		try {
			await Notifications.cancelScheduledNotificationAsync(UploadNotificationManager.UPLOAD_NOTIFICATION_ID)
		} catch (error) {
			console.warn('📱 Failed to cancel notification:', error)
		}
	}

	async cancelUploadSession(): Promise<void> {
		this.uploadSessionActive = false

		// Clear any pending update timeout
		if (this.updateTimeout) {
			clearTimeout(this.updateTimeout)
			this.updateTimeout = null
		}

		await this.cancelCurrentNotification()
		this.activeUploads.clear()
	}
}

// Export singleton instance
export const uploadNotificationManager = UploadNotificationManager.getInstance()

// Simple download notification functions
export const showDownloadNotification = async (success: boolean, message: string): Promise<void> => {
	try {
		// Check if notifications are permitted
		const {status} = await Notifications.getPermissionsAsync()
		if (status !== 'granted') {
			console.log('Notifications not permitted, skipping download notification')
			return
		}

		const title = success ? 'Download Complete' : 'Download Failed'
		const emoji = success ? '📥' : '❌'

		const notificationContent: any = {
			title: `${emoji} ${title}`,
			body: message,
			data: {
				type: 'download-complete',
				success
			},
			sticky: false
		}

		// Configure for Android
		if (Platform.OS === 'android') {
			notificationContent.android = {
				channelId: 'upload-progress', // Reuse existing channel
				autoCancel: true,
				ongoing: false,
				priority: success ? 'default' : 'high',
				visibility: 'public'
			}
		}

		await Notifications.scheduleNotificationAsync({
			identifier: `download-${Date.now()}`, // Unique ID for each download
			content: notificationContent,
			trigger: null
		})
	} catch (error) {
		console.error('Failed to show download notification:', error)
	}
}
