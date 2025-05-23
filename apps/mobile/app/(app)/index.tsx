import React, {useEffect, useState} from 'react'
import {Text, View} from 'react-native'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {Link, useRouter} from 'expo-router'
import {useSession} from '@/src/components/session-provider'
import {useExampleDialog} from '@/src/components/dialog-provider'
import {authClient} from '@/src/lib/auth-client'
import {SafeAreaView} from 'react-native-safe-area-context'

const Home = () => {
	const {theme} = useTheme()
	const router = useRouter()
	const {user, status, signOut} = useSession()
	const {setExampleDialogOpen} = useExampleDialog()
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
		<SafeAreaView className="flex-1 bg-background">
			<View className="p-6">
				<Text className="text-primary-foreground text-2xl font-bold mb-6">Welcome to Halycron</Text>

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

				<View className="gap-4">
					<Button variant="default" onPress={() => console.log('Action button pressed')}>
						<Text className="text-primary-foreground">Take Action</Text>
					</Button>

					<Button onPress={() => setExampleDialogOpen(true)}>
						<Text className="text-primary-foreground">Test Dialog</Text>
					</Button>

					<Link href="/upload">
						{/* <Button>*/}
						<Text className="text-primary-foreground">Test Routed Modal</Text>
						{/* </Button>*/}
					</Link>

					<Button onPress={handleLogout}>
						<Text className="text-primary-foreground">Log Out</Text>
					</Button>
				</View>
			</View>
		</SafeAreaView>
	)
}

export default Home
