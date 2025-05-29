import React, {useEffect, useMemo} from 'react'
import {Animated, Image, ScrollView, Text, View} from 'react-native'
import {UploadState} from '../lib/types'
import {Upload} from '@/lib/icons/Upload'
import {AlertCircle} from '@/lib/icons/AlertCircle'
import {Check} from '@/lib/icons/Check'
import {Lock} from '@/lib/icons/Lock'
import {darkTheme} from '@/src/theme/theme'

interface UploadProgressProps {
	uploadStates: Record<string, UploadState>
	showProgress: boolean
	onHoverChange?: (isHovering: boolean) => void
}

const getStatusIcon = (status: UploadState['status']) => {
	switch (status) {
	case 'idle':
		return <Upload className="w-3 h-3 text-white"/>
	case 'encrypting':
		return <Lock className="w-3 h-3 text-white"/>
	case 'uploading':
		return <Upload className="w-3 h-3 text-white"/>
	case 'uploaded':
		return <Check className="w-3 h-3 text-white"/>
	case 'error':
		return <AlertCircle className="w-3 h-3 text-white"/>
	default:
		return <Upload className="w-3 h-3 text-white"/>
	}
}

const getStatusText = (status: UploadState['status']) => {
	switch (status) {
	case 'idle':
		return 'Queued'
	case 'encrypting':
		return 'Encrypting...'
	case 'uploading':
		return 'Uploading...'
	case 'uploaded':
		return 'Uploaded'
	case 'error':
		return 'Failed'
	default:
		return 'Unknown'
	}
}

const calculateEstimatedTime = (uploadStates: Record<string, UploadState>): string => {
	const files = Object.entries(uploadStates)
	const activeFiles = files.filter(([_, state]) => state.status === 'encrypting' || state.status === 'uploading')
	const queuedFiles = files.filter(([_, state]) => state.status === 'idle')
	files.filter(([_, state]) => state.status === 'uploaded' || state.status === 'error')

	// If no active uploads, show completion or queue status
	if (activeFiles.length === 0) {
		if (queuedFiles.length > 0) {
			return 'Starting upload...'
		}
		return 'Complete'
	}

	// Calculate average progress of active files
	const totalProgress = activeFiles.reduce((sum, [_, state]) => sum + state.progress, 0)
	const averageProgress = totalProgress / activeFiles.length

	// Estimate time per file based on current progress (assuming 30-60 seconds per file on average)
	const estimatedTimePerFile = averageProgress > 10
		? (100 - averageProgress) / averageProgress * 2 // Dynamic based on current progress
		: 45 // Default estimate for new files

	// Calculate remaining time for active files
	const remainingTimeForActive = activeFiles.reduce((sum, [_, state]) => {
		const remainingProgress = 100 - state.progress
		return sum + (remainingProgress / 100) * estimatedTimePerFile
	}, 0)

	// Add time for queued files
	const timeForQueued = queuedFiles.length * estimatedTimePerFile

	const totalEstimatedSeconds = remainingTimeForActive + timeForQueued

	// Format the time
	if (totalEstimatedSeconds < 60) {
		return `${Math.ceil(totalEstimatedSeconds)} sec`
	} else if (totalEstimatedSeconds < 3600) {
		const minutes = Math.ceil(totalEstimatedSeconds / 60)
		return `${minutes} min`
	} else {
		const hours = Math.floor(totalEstimatedSeconds / 3600)
		const minutes = Math.ceil((totalEstimatedSeconds % 3600) / 60)
		return `${hours}h ${minutes}m`
	}
}

const PulsingBorder: React.FC<{
	children: React.ReactNode
	isActive: boolean
	status: UploadState['status']
}> = ({children, isActive, status}) => {
	const pulseAnimation = new Animated.Value(1)

	useEffect(() => {
		if (isActive) {
			const pulse = Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnimation, {
						toValue: 0.7,
						duration: 1000,
						useNativeDriver: false
					}),
					Animated.timing(pulseAnimation, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: false
					})
				])
			)
			pulse.start()
			return () => pulse.stop()
		}
	}, [isActive])

	const getBorderColor = () => {
		switch (status) {
		case 'encrypting':
			return 'rgba(255, 206, 84, 0.5)' // Yellow for encrypting
		case 'uploading':
			return 'rgba(59, 130, 246, 0.5)' // Blue for uploading
		case 'uploaded':
			return darkTheme.primary // Primary for success
		case 'error':
			return 'rgba(239, 68, 68, 0.5)' // Red for error
		default:
			return 'rgba(156, 163, 175, 0.5)' // Gray for idle
		}
	}

	return (
		<Animated.View
			style={{
				borderWidth: 2,
				borderColor: getBorderColor(),
				borderRadius: 8,
				opacity: isActive ? pulseAnimation : 1
			}}
		>
			{children}
		</Animated.View>
	)
}

const ImagePreview: React.FC<{
	state: UploadState
	fileName: string
}> = ({state, fileName}) => {
	const isActive = state.status === 'encrypting' || state.status === 'uploading'

	return (
		<View className="mr-3">
			<PulsingBorder isActive={isActive} status={state.status}>
				<View className="w-16 h-16 rounded-lg overflow-hidden bg-muted relative">
					{state.imageUri ? (
						<Image
							source={{uri: state.imageUri}}
							className="w-full h-full"
							resizeMode="cover"
						/>
					) : (
						<View className="w-full h-full items-center justify-center bg-muted">
							<Upload size={24} color="rgba(255, 255, 255, 0.5)" />
						</View>
					)}

					{/* Status overlay */}
					{state.status === 'uploaded' ? (
						/* Success overlay covers entire preview */
						<View className="absolute inset-0 bg-background items-center justify-center rounded-lg opacity-70" />
					) : (
						/* Regular status icon for other states */
						<View className="absolute inset-0 items-center justify-center">
							<View className="bg-black/70 rounded-full p-2">
								{getStatusIcon(state.status)}
							</View>
						</View>
					)}

					{state.status === 'uploaded' && (
						<View className="absolute inset-0 items-center justify-center">
							<Check size={20} color="#fff" strokeWidth={2} />
						</View>
					)}

					{/* Progress indicator for active uploads */}
					{isActive && (
						<View className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
							<View
								className="h-full bg-white/80"
								style={{width: `${state.progress}%`}}
							/>
						</View>
					)}
				</View>
			</PulsingBorder>
		</View>
	)
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
	uploadStates,
	showProgress,
	onHoverChange
}) => {
	const files = Object.entries(uploadStates)
	const hasFiles = files.length > 0

	// Progress animation
	const progressAnimation = useMemo(() => new Animated.Value(0), [])

	useEffect(() => {
		// Call onHoverChange when component visibility changes
		onHoverChange?.(showProgress && hasFiles)
	}, [showProgress, hasFiles, onHoverChange])

	if (!showProgress || !hasFiles) {
		return null
	}

	const totalFiles = files.length
	const completedFiles = files.filter(([_, state]) => state.status === 'uploaded' || state.status === 'error').length
	const successfulFiles = files.filter(([_, state]) => state.status === 'uploaded').length

	// Show first 5 images, then "+X more"
	const visibleFiles = files.slice(0, 5)
	const remainingCount = Math.max(0, totalFiles - 5)

	// Animate progress bar
	const progressPercentage = (completedFiles / totalFiles) * 100
	useEffect(() => {
		Animated.timing(progressAnimation, {
			toValue: progressPercentage,
			duration: 500,
			useNativeDriver: false
		}).start()
	}, [progressPercentage, progressAnimation])

	return (
		<View className="">
			<Text className="text-primary-foreground text-2xl font-semibold mb-8">Uploading {totalFiles} photos</Text>

			{/* Image Previews Row */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				className="flex-row mb-8"
			>
				{visibleFiles.map(([fileName, state]) => (
					<ImagePreview
						key={fileName}
						state={state}
						fileName={fileName}
					/>
				))}

				{/* Show remaining count if more than 5 */}
				{remainingCount > 0 && (
					<View className="mr-3">
						<View className="w-16 h-16 rounded-lg bg-muted/50 border-2 border-muted-foreground items-center justify-center">
							<Text className="text-primary-foreground opacity-70 text-xs font-medium text-center">
								+{remainingCount}{'\n'}more
							</Text>
						</View>
					</View>
				)}
			</ScrollView>

			{/* Overall Progress */}
			<View className="">
				<View className="h-2 bg-muted rounded-full overflow-hidden mb-4">
					<Animated.View
						className="h-full bg-primary rounded-full"
						style={{
							width: progressAnimation.interpolate({
								inputRange: [0, 100],
								outputRange: ['0%', '100%'],
								extrapolate: 'clamp'
							})
						}}
					/>
				</View>
				<View className="flex-row items-center justify-between">
					{completedFiles === totalFiles ? (
						<Text className="text-sm text-primary-foreground opacity-70">
							Upload completed
						</Text>
					) : (
						<Text className="text-sm text-primary-foreground opacity-70">
							Time remaining: {calculateEstimatedTime(uploadStates)}
						</Text>
					)}
					<Text className="text-sm font-medium text-primary-foreground opacity-50">
						{completedFiles}/{totalFiles} files
					</Text>
				</View>
			</View>
		</View>
	)
}
