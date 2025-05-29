import React, {useEffect} from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Alert, Text, View} from 'react-native'
import {usePhotoUpload} from '@/src/hooks/use-photo-upload'
import {UploadProgress} from '@/src/components/upload-progress'
import {Lock, Shield, Upload} from 'lucide-react-native'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/src/lib/photo-keys'
import {Button} from '@/src/components/ui/button'

const UploadScreen = () => {
	const queryClient = useQueryClient()

	const {
		uploadStates,
		showProgress,
		selectAndUploadPhotos,
		fileRejections,
		onProgressHoverChange
	} = usePhotoUpload({
		onPhotoUploaded: (photo) => {
			// Invalidate queries to refresh the gallery
			queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
		}
	})

	// Show error alerts for file rejections
	useEffect(() => {
		if (fileRejections.length > 0) {
			const errors = fileRejections.map(rejection => `${rejection.fileName}: ${rejection.error}`).join('\n')
			Alert.alert('Upload Error', errors)
		}
	}, [fileRejections])

	const hasActiveUploads = Object.values(uploadStates).some(
		state => state.status === 'encrypting' || state.status === 'uploading'
	)

	return (
		<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
			<View className="flex-1">
				{/* Header */}
				<View className="mt-16 p-6">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Upload</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">
						{hasActiveUploads ? 'Uploading...' : 'Secure Photos'}
					</Text>
				</View>

				{/* Upload Progress */}
				{showProgress && (
					<View className="px-6 mt-8 mb-4">
						<UploadProgress
							uploadStates={uploadStates}
							showProgress={showProgress}
							onHoverChange={onProgressHoverChange}
						/>
					</View>
				)}

				{!showProgress && (
					<View className="flex-1 px-6 items-center justify-center">
						<View className="items-center justify-center">
							{/* Main Upload Icon */}
							<View className="relative mb-6">
								<View className="bg-primary/10 rounded-full p-8 mb-4">
									<Upload
										size={48}
										color="rgba(255, 255, 255, 0.8)"
										strokeWidth={1.5}
									/>
								</View>

								{/* Security badges */}
								<View className="absolute -top-2 -right-2 bg-primary/20 rounded-full p-2">
									<Lock size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5}/>
								</View>
								<View className="absolute -bottom-2 -left-2 bg-primary/20 rounded-full p-2">
									<Shield size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5}/>
								</View>
							</View>

							{/* Upload messaging */}
							<Text className="text-primary-foreground opacity-60 text-lg font-medium text-center mb-2">
								Ready to Upload
							</Text>
							<Text className="text-primary-foreground opacity-40 text-sm text-center leading-5 max-w-64">
								Your photos will be encrypted before upload, ensuring maximum privacy and security
							</Text>
						</View>
					</View>
				)}

				{/* Spacer to push content to bottom - only when showing progress */}
				{showProgress && <View className="flex-1"/>}

				{/* Main Content - Stuck at bottom */}
				<View className="p-6 pb-8">
					{/* Upload Button */}
					<View className="items-center mb-8">
						<Button
							onPress={selectAndUploadPhotos}
							disabled={hasActiveUploads}
							className="h-16 w-full"
						>
							<Text className="text-primary-foreground font-semibold">
								{hasActiveUploads ? 'Uploading Photos...' : 'Select Photos to Upload'}
							</Text>
						</Button>
					</View>

					{/* Supported Formats */}
					<View className="mb-4">
						<Text className="text-primary-foreground opacity-40 text-center leading-6">
							We welcome JPEG, PNG, HEIC, HEIF, AVIF, AVIS, WEBP and RAW formats
						</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	)
}

export default UploadScreen
