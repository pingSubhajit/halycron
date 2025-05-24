import React from 'react'
import {ScrollView, Text, View} from 'react-native'
import {useSession} from '@/src/components/session-provider'
import {SafeAreaView} from 'react-native-safe-area-context'

const Albums = () => {
	const {user} = useSession()

	return (
		<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
			<ScrollView
				className="flex-1"
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={{paddingBottom: 100}}
			>
				{/* Header */}
				<View className="mt-16 p-6">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Your</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">Albums</Text>
				</View>

				{/* Albums Content */}
				<View className="flex-1 p-6">
					<Text className="text-primary-foreground text-lg opacity-70">
						Albums feature coming soon...
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

export default Albums
