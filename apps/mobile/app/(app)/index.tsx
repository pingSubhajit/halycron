import React, {useEffect, useState} from 'react'
import {Text, View} from 'react-native'
import {useSession} from '@/src/components/session-provider'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useAllPhotos} from '@/src/hooks/use-photos'
import {PhotoGallery} from '@/src/components/photo-gallery'

const Home = () => {
	const {user} = useSession()
	const [shouldLoadGallery, setShouldLoadGallery] = useState(false)

	// Reduce delay for better perceived performance
	useEffect(() => {
		const timer = setTimeout(() => {
			setShouldLoadGallery(true)
		}, 50) // Reduced from 100ms to 50ms

		return () => clearTimeout(timer)
	}, [])

	const renderHeader = () => (
		<View className="mt-16 p-6">
			<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Welcome</Text>
			<Text className="text-primary-foreground text-6xl font-bold mb-4">{user?.name.split(' ')[0]}</Text>
		</View>
	)

	return (
		<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
			{shouldLoadGallery ? (
				<AsyncPhotoGallery headerComponent={renderHeader}/>
			) : (
				<View className="flex-1">
					{renderHeader()}
				</View>
			)}
		</SafeAreaView>
	)
}

// Separate component that handles the async photo loading
const AsyncPhotoGallery = ({headerComponent}: { headerComponent: () => React.ReactElement }) => {
	const {data: photos, isLoading, error, refetch, isRefetching} = useAllPhotos()

	const handleRefresh = () => {
		refetch()
	}

	return (
		<PhotoGallery
			photos={photos || []}
			isLoading={isLoading}
			error={error?.message || null}
			headerComponent={headerComponent}
			onRefresh={handleRefresh}
			isRefreshing={isRefetching}
		/>
	)
}

export default Home
