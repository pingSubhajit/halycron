import React from 'react'
import {Text, View} from 'react-native'
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
			<View className="flex-1">
				{/* Header */}
				<View className="p-6 pb-4">
					<Text className="text-primary-foreground text-2xl font-bold mb-2">Welcome to Halycron</Text>

					<Text className="text-primary-foreground mb-4">
						{user?.name ? `You are logged in as ${user.name}` : 'Welcome!'}
					</Text>
				</View>

				{/* Photo Gallery */}
				<View className="flex-1">
					<PhotoGallery
						photos={photos || []}
						isLoading={isLoading}
						error={error?.message || null}
					/>
				</View>
			</View>
		</SafeAreaView>
	)
}

export default Home
