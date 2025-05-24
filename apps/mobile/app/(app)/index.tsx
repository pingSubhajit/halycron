import React, {useEffect, useState} from 'react'
import {ScrollView, Text, View} from 'react-native'
import {useSession} from '@/src/components/session-provider'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useAllPhotos} from '@/src/hooks/use-photos'
import {PhotoGallery} from '@/src/components/photo-gallery'

const Home = () => {
	const {user} = useSession()
	const [shouldLoadGallery, setShouldLoadGallery] = useState(false)

	// Delay the gallery loading to show the page immediately
	useEffect(() => {
		const timer = setTimeout(() => {
			setShouldLoadGallery(true)
		}, 100) // Small delay to allow the page to render first

		return () => clearTimeout(timer)
	}, [])

	return (
		<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
			<ScrollView
				className="flex-1"
				contentInsetAdjustmentBehavior="automatic"
			>
				{/* Header */}
				<View className="mt-16 p-6">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Welcome</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">{user?.name.split(' ')[0]}</Text>
				</View>

				{/* Photo Gallery */}
				<View className="flex-1">
					{shouldLoadGallery && <AsyncPhotoGallery/>}
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

// Separate component that handles the async photo loading
const AsyncPhotoGallery = () => {
	const {data: photos, isLoading, error} = useAllPhotos()

	return (
		<PhotoGallery
			photos={photos || []}
			isLoading={isLoading}
			error={error?.message || null}
		/>
	)
}

export default Home
