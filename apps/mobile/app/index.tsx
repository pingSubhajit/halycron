import React from 'react'
import {ScrollView, Text, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {Button} from '../src/components/Button'
import {useTheme} from '../src/theme/ThemeProvider'

const Home = () => {
	const {theme, isDark, toggleTheme} = useTheme()

	return (
		<ScrollView
			className="flex-1"
			style={{backgroundColor: theme.background}}
		>
			<StatusBar style={'dark'}/>

			<View className="p-6">
				<Text className="text-foreground text-2xl font-bold mb-6">Button Examples</Text>

				<View className="space-y-4">
					<Button variant="default" onPress={() => console.log('Default button pressed')}>
						Default Button
					</Button>

					<Button variant="destructive" onPress={() => console.log('Destructive button pressed')}>
						Destructive Button
					</Button>

					<Button variant="outline" onPress={() => console.log('Outline button pressed')}>
						Outline Button
					</Button>

					<Button variant="secondary" onPress={() => console.log('Secondary button pressed')}>
						Secondary Button
					</Button>

					<Button variant="ghost" onPress={() => console.log('Ghost button pressed')}>
						Ghost Button
					</Button>

					<Button variant="link" onPress={() => console.log('Link button pressed')}>
						Link Button
					</Button>

					<Button variant="default" size="sm" onPress={() => console.log('Small button pressed')}>
						Small Button
					</Button>

					<Button variant="default" size="lg" onPress={() => console.log('Large button pressed')}>
						Large Button
					</Button>

					<Button variant="default" isLoading onPress={() => console.log('Loading button pressed')}>
						Loading Button
					</Button>

					<Button variant="default" onPress={toggleTheme}>
						Toggle Theme
					</Button>
				</View>
			</View>
		</ScrollView>
	)
}

export default Home
