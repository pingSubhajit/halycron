import React from 'react'
import {ScrollView, Text, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

const Albums = () => {
	return (
		<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
			<ScrollView
				className="flex-1"
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={{paddingBottom: 100}}
			>
				{/* Header */}
				<View className="p-6">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Albums</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">Coming Soon</Text>
				</View>

				{/* Main Content */}
				<View className="flex-1 p-6">
					{/* Album Icon Placeholder */}
					<View className="items-center mb-8">
						<View
							className="w-32 h-32 bg-primary/10 border-2 border-primary/20 rounded-3xl items-center justify-center mb-6">
							<View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center">
								<Text className="text-primary text-4xl font-bold">📁</Text>
							</View>
						</View>
					</View>

					{/* Description */}
					<View className="mb-8">
						<Text className="text-primary-foreground text-2xl font-semibold mb-4 text-center">
							Protected & Secure Albums
						</Text>
						<Text className="text-primary-foreground opacity-70 text-lg leading-7 text-center mb-6">
							Organize your memories with intelligent albums featuring password protection, secure
							sharing, and complete privacy control.
						</Text>
					</View>

					{/* Key Features */}
					<View className="mb-8">
						<Text className="text-primary-foreground text-xl font-semibold mb-4">Album Features:</Text>

						<View className="space-y-4">
							<View className="flex-row items-center">
								<View
									className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2 mt-1">
									<Text className="text-primary text-sm font-bold">🔒</Text>
								</View>
								<View className="flex-1">
									<Text className="text-primary-foreground font-semibold text-base mb-1">
										Sensitive & Protected Albums
									</Text>
								</View>
							</View>

							<View className="flex-row items-center">
								<View
									className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2 mt-1">
									<Text className="text-primary text-sm font-bold">🔗</Text>
								</View>
								<View className="flex-1">
									<Text className="text-primary-foreground font-semibold text-base mb-1">
										Secure Sharing
									</Text>
								</View>
							</View>

							<View className="flex-row items-center">
								<View
									className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2 mt-1">
									<Text className="text-primary text-sm font-bold">🤖</Text>
								</View>
								<View className="flex-1">
									<Text className="text-primary-foreground font-semibold text-base mb-1">
										Smart Organization
									</Text>
								</View>
							</View>

							<View className="flex-row items-center">
								<View
									className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2 mt-1">
									<Text className="text-primary text-sm font-bold">🛡️</Text>
								</View>
								<View className="flex-1">
									<Text className="text-primary-foreground font-semibold text-base mb-1">
										Zero-Knowledge Architecture
									</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Privacy Highlight */}
					<View className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
						<Text className="text-primary-foreground text-lg font-semibold mb-3 text-center">
							Privacy by Design
						</Text>
						<Text className="text-primary-foreground opacity-80 text-base text-center leading-6">
							"Privacy isn't something you should have to ask for. It should be the default." - Your
							albums will be completely private, with no backdoors or compromises.
						</Text>
					</View>

					{/* Progress Indicator */}
					<View className="mb-8">
						<View className="flex-row items-center justify-between mb-2">
							<Text className="text-primary-foreground opacity-70 text-sm">Development Progress</Text>
							<Text className="text-primary text-sm font-semibold">60%</Text>
						</View>
						<View className="h-2 bg-muted rounded-full overflow-hidden">
							<View className="h-full w-3/5 bg-primary rounded-full"/>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

export default Albums
