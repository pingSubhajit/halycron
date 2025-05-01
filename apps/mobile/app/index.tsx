import React from 'react'
import {ScrollView, Text, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {Button} from '../src/components/Button'
import {useTheme} from '../src/theme/ThemeProvider'

const Home = () => {
	const {theme} = useTheme()

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
				</View>
			</View>
		</ScrollView>
	)
}

export default Home
