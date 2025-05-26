import React from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import {ScrollView, Text, View} from 'react-native'

const UploadScreen = () => {
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
					<Text className="text-primary-foreground text-6xl font-bold mb-4">Coming Soon</Text>
				</View>

				{/* Main Content */}
				<View className="flex-1 p-6">
					{/* Upload Icon Placeholder */}
					<View className="items-center mb-8">
						<View
							className="w-32 h-32 bg-primary/10 border-2 border-primary/20 rounded-3xl items-center justify-center mb-6">
							<View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center">
								<Text className="text-primary text-4xl font-bold">↑</Text>
							</View>
						</View>
					</View>

					{/* Description */}
					<View className="mb-8">
						<Text className="text-primary-foreground text-2xl font-semibold mb-4 text-center">
							Secure Photo Upload
						</Text>
						<Text className="text-primary-foreground opacity-70 text-lg leading-7 text-center mb-6">
							We're building something amazing for you. Soon you'll be able to securely upload and manage
							your photos with end-to-end encryption.
						</Text>
					</View>

					{/* Features Preview */}
					<View className="mb-8">
						<Text className="text-primary-foreground text-xl font-semibold mb-4">What's Coming:</Text>

						<View className="space-y-4">
							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2">
									<Text className="text-primary text-sm font-bold">✓</Text>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									Drag & drop photo uploads
								</Text>
							</View>

							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2">
									<Text className="text-primary text-sm font-bold">✓</Text>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									Automatic organization & tagging
								</Text>
							</View>

							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2">
									<Text className="text-primary text-sm font-bold">✓</Text>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									End-to-end encryption
								</Text>
							</View>

							<View className="flex-row items-center">
								<View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2">
									<Text className="text-primary text-sm font-bold">✓</Text>
								</View>
								<Text className="text-primary-foreground opacity-80 text-base flex-1">
									Smart backup & sync
								</Text>
							</View>
						</View>
					</View>

					{/* Progress Indicator */}
					<View className="mb-8">
						<View className="flex-row items-center justify-between mb-2">
							<Text className="text-primary-foreground opacity-70 text-sm">Development Progress</Text>
							<Text className="text-primary text-sm font-semibold">75%</Text>
						</View>
						<View className="h-2 bg-muted rounded-full overflow-hidden">
							<View className="h-full w-3/4 bg-primary rounded-full"/>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

export default UploadScreen
