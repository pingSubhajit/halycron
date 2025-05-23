import React, {useEffect, useState} from 'react'
import {ScrollView, Text, View} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {useSession} from '@/src/components/session-provider'
import {authClient} from '@/src/lib/auth-client'

const Home = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const {user, status, signOut} = useSession()
	const [cookieInfo, setCookieInfo] = useState<string>('Loading...')

	useEffect(() => {
		// Get cookie info for debugging
		const cookie = authClient.getCookie()
		setCookieInfo(cookie || 'No cookie found')
	}, [])

	// Handle logout action
	const handleLogout = async () => {
		await signOut()
		router.push('/onboarding')
	}

	return (
		<ScrollView
			className="flex-1"
			style={{backgroundColor: theme.background}}
		>
			<View className="p-6">
				<Text className="text-foreground text-2xl font-bold mb-6">Welcome to Halycron</Text>

				<View className="bg-gray-100 p-4 rounded-md mb-6">
					<Text className="text-gray-700 font-bold">Auth Debug Info:</Text>
					<Text className="text-gray-700">Status: {status}</Text>
					<Text className="text-gray-700">User: {user?.email || 'Not logged in'}</Text>
					<Text className="text-gray-700 text-xs" numberOfLines={2}>
						Cookie: {cookieInfo}
					</Text>
				</View>

				<Text className="text-foreground mb-6">
					{user?.name ? `You are logged in as ${user.name}` : 'Welcome!'}
				</Text>

				<View className="space-y-4">
					<Button variant="default" onPress={() => console.log('Action button pressed')}>
						<Text>Take Action</Text>
					</Button>

					<Button variant="outline" onPress={handleLogout}>
						<Text>Log Out</Text>
					</Button>
				</View>
			</View>
		</ScrollView>
	)
}

export default Home
