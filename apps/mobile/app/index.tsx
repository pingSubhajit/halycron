import React from 'react'
import {ScrollView, Text, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {Redirect, useRouter} from 'expo-router'

// This would normally check if the user is authenticated
const isAuthenticated = false

const Home = () => {
	const {theme} = useTheme()
	const router = useRouter()

	// For demo purposes, redirect to onboarding if not authenticated
	if (isAuthenticated === false) {
		return <Redirect href="/onboarding"/>
	}

	return (
		<ScrollView
			className="flex-1"
			style={{backgroundColor: theme.background}}
		>
			<StatusBar style={'dark'}/>

			<View className="p-6">
				<Text className="text-foreground text-2xl font-bold mb-6">Welcome to Halycron</Text>

				<Text className="text-foreground mb-6">You are now logged in to the home screen.</Text>

				<View className="space-y-4">
					<Button variant="default" onPress={() => console.log('Action button pressed')}>
						<Text>Take Action</Text>
					</Button>

					<Button variant="outline" onPress={() => router.push('/onboarding')}>
						<Text>Log Out</Text>
					</Button>
				</View>
			</View>
		</ScrollView>
	)
}

export default Home
