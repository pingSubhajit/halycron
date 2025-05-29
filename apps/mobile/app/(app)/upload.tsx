import React, {useEffect} from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Alert, Pressable, ScrollView, Text, View} from 'react-native'
import {usePhotoUpload} from '@/src/hooks/use-photo-upload'
import {UploadProgress} from '@/src/components/upload-progress'
import {CheckCircle, Lock, Shield, Upload} from 'lucide-react-native'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/src/lib/photo-keys'

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
			<ScrollView
				className="flex-1"
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={{paddingBottom: 100}}
			>
				{/* Header */}
				<View className="mt-16 p-6">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Upload</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">
						{hasActiveUploads ? 'Uploading...' : 'Secure Photos'}
					</Text>
				</View>

				{/* Main Content */}
				<View className="flex-1 p-6">
					{/* Upload Button */}
					<View className="items-center mb-8">
						<Pressable
							onPress={selectAndUploadPhotos}
							disabled={hasActiveUploads}
							className={`w-32 h-32 border-2 border-primary/20 rounded-3xl items-center justify-center mb-6 ${
								hasActiveUploads ? 'bg-primary/5 opacity-50' : 'bg-primary/10 active:bg-primary/20'
							}`}
						>
							<View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center">
								{hasActiveUploads ? (
									<Lock color="#3b82f6" size={32}/>
								) : (
									<Upload color="#3b82f6" size={32}/>
								)}
							</View>
						</Pressable>

						<Pressable
							onPress={selectAndUploadPhotos}
							disabled={hasActiveUploads}
							className={`px-8 py-4 bg-primary rounded-2xl ${
								hasActiveUploads ? 'opacity-50' : 'active:bg-primary/90'
							}`}
						>
							<Text className="text-primary-foreground text-lg font-semibold text-center">
								{hasActiveUploads ? 'Uploading Photos...' : 'Select Photos to Upload'}
							</Text>
						</Pressable>
					</View>

					{/* Security Notice */}
					<View className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
						<View className="flex-row items-center mb-2">
							<Shield color="#3b82f6" size={20}/>
							<Text className="text-primary-foreground text-lg font-semibold ml-2">
								End-to-End Encryption
							</Text>
						</View>
						<Text className="text-primary-foreground opacity-80 text-base leading-6">
							Your photos are encrypted on your device before upload. Only you have the keys to decrypt
							them.
						</Text>
					</View>

					{/* Upload Progress */}
					{showProgress && (
						<View className="mb-8">
							<UploadProgress
								uploadStates={uploadStates}
								showProgress={showProgress}
								onHoverChange={onProgressHoverChange}
								className="bg-card border-border"
							/>
						</View>
					)}

					{/* Features */}
					<View className="mb-8">
						<Text className="text-primary-foreground text-xl font-semibold mb-4">Security Features:</Text>

						<View className="space-y-4">
							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center mr-3">
									<CheckCircle color="#22c55e" size={16}/>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									AES-256 encryption on device
								</Text>
							</View>

							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center mr-3">
									<CheckCircle color="#22c55e" size={16}/>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									Zero-knowledge architecture
								</Text>
							</View>

							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center mr-3">
									<CheckCircle color="#22c55e" size={16}/>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									Automatic organization & tagging
								</Text>
							</View>

							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center mr-3">
									<CheckCircle color="#22c55e" size={16}/>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									Secure cloud backup
								</Text>
							</View>
						</View>
					</View>

					{/* Supported Formats */}
					<View className="mb-8">
						<Text className="text-primary-foreground text-lg font-semibold mb-3">Supported Formats:</Text>
						<Text className="text-primary-foreground opacity-70 text-base leading-6">
							JPEG, PNG, HEIC, HEIF, AVIF, WEBP, and RAW formats (ARW, CR2, NEF, ORF, RW2)
						</Text>
					</View>

					{/* Progress Indicator */}
					<View className="mb-8">
						<View className="flex-row items-center justify-between mb-2">
							<Text className="text-primary-foreground opacity-70 text-sm">Feature Completeness</Text>
							<Text className="text-primary text-sm font-semibold">100%</Text>
						</View>
						<View className="h-2 bg-muted rounded-full overflow-hidden">
							<View className="h-full w-full bg-green-500 rounded-full"/>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

export default UploadScreen
