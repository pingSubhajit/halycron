import React, {useEffect} from 'react'
import {ScrollView, Text, View} from 'react-native'
import {UploadState} from '../lib/types'
import {AlertCircle, CheckCircle, Lock, Upload} from 'lucide-react-native'

interface UploadProgressProps {
	uploadStates: Record<string, UploadState>
	showProgress: boolean
	onHoverChange?: (isHovering: boolean) => void
	className?: string
}

const getStatusColor = (status: UploadState['status']) => {
	switch (status) {
	case 'idle':
		return 'text-muted-foreground'
	case 'encrypting':
		return 'text-yellow-500'
	case 'uploading':
		return 'text-blue-500'
	case 'uploaded':
		return 'text-green-500'
	case 'error':
		return 'text-red-500'
	default:
		return 'text-muted-foreground'
	}
}

const getStatusIcon = (status: UploadState['status']) => {
	switch (status) {
	case 'idle':
		return <Upload className="w-4 h-4 text-muted-foreground"/>
	case 'encrypting':
		return <Lock className="w-4 h-4 text-yellow-500"/>
	case 'uploading':
		return <Upload className="w-4 h-4 text-blue-500"/>
	case 'uploaded':
		return <CheckCircle className="w-4 h-4 text-green-500"/>
	case 'error':
		return <AlertCircle className="w-4 h-4 text-red-500"/>
	default:
		return <Upload className="w-4 h-4 text-muted-foreground"/>
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

export const UploadProgress: React.FC<UploadProgressProps> = ({
	uploadStates,
	showProgress,
	onHoverChange,
	className = ''
}) => {
	const files = Object.entries(uploadStates)
	const hasFiles = files.length > 0

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

	return (
		<View className={`bg-background border border-border rounded-lg p-4 ${className}`}>
			{/* Header */}
			<View className="flex-row items-center justify-between mb-3">
				<Text className="text-lg font-semibold text-foreground">
					Upload Progress
				</Text>
				<Text className="text-sm text-muted-foreground">
					{completedFiles}/{totalFiles} files
				</Text>
			</View>

			{/* Overall Progress */}
			<View className="mb-4">
				<View className="flex-row items-center justify-between mb-2">
					<Text className="text-sm text-muted-foreground">
						{successfulFiles} successful, {completedFiles - successfulFiles} failed
					</Text>
					<Text className="text-sm font-medium text-foreground">
						{Math.round((completedFiles / totalFiles) * 100)}%
					</Text>
				</View>
				<View className="h-2 bg-muted rounded-full overflow-hidden">
					<View
						className="h-full bg-primary rounded-full"
						style={{width: `${(completedFiles / totalFiles) * 100}%`}}
					/>
				</View>
			</View>

			{/* File List */}
			<ScrollView className="max-h-40" showsVerticalScrollIndicator={false}>
				{files.map(([fileName, state]) => (
					<View key={fileName}
						className="flex-row items-center py-2 border-b border-border/50 last:border-b-0">
						<View className="mr-3">
							{getStatusIcon(state.status)}
						</View>

						<View className="flex-1">
							<Text className="text-sm font-medium text-foreground" numberOfLines={1}>
								{fileName}
							</Text>
							<View className="flex-row items-center mt-1">
								<Text className={`text-xs ${getStatusColor(state.status)}`}>
									{getStatusText(state.status)}
								</Text>
								{state.error && (
									<Text className="text-xs text-red-500 ml-2" numberOfLines={1}>
										• {state.error}
									</Text>
								)}
							</View>
						</View>

						{(state.status === 'uploading' || state.status === 'encrypting') && (
							<View className="ml-2 min-w-[40px]">
								<Text className="text-xs text-muted-foreground text-right">
									{state.progress}%
								</Text>
							</View>
						)}
					</View>
				))}
			</ScrollView>

			{/* Completion Summary */}
			{completedFiles === totalFiles && (
				<View className="mt-3 pt-3 border-t border-border">
					<Text className="text-sm text-center text-muted-foreground">
						{successfulFiles === totalFiles
							? `All ${totalFiles} photos uploaded successfully!`
							: `${successfulFiles}/${totalFiles} photos uploaded successfully`
						}
					</Text>
				</View>
			)}
		</View>
	)
}
