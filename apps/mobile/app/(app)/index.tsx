import React from 'react'
import {ScrollView, Text, View} from 'react-native'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {useSession} from '@/src/components/session-provider'
import {useExampleDialog} from '@/src/components/dialog-provider'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useAllPhotos} from '@/src/hooks/use-photos'
import {PhotoGallery} from '@/src/components/photo-gallery'

const Home = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const {user, signOut} = useSession()
	const {setExampleDialogOpen} = useExampleDialog()
	const {data: photos, isLoading, error} = useAllPhotos()

	// Handle logout action
	const handleLogout = async () => {
		await signOut()
		router.push('/onboarding')
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView className="flex-1">
				{/* Header */}
				<View className="mt-8 p-6">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Welcome</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">{user?.name.split(' ')[0]}</Text>
				</View>

				{/* Photo Gallery */}
				<View className="flex-1">
					<PhotoGallery
						photos={photos || []}
						isLoading={isLoading}
						error={error?.message || null}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

export default Home
