import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {Button} from '@/src/components/Button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {Image} from '@/src/components/interops'
import logo from '@halycron/ui/media/logo.svg'

const Onboarding = () => {
	const {theme} = useTheme()
	const router = useRouter()

	return (
		<View
			className="flex-1 justify-end px-6"
			style={{backgroundColor: theme.background}}
		>
			<StatusBar style="dark"/>

			<Image
				className="w-36 h-9 mb-7"
				source={logo}
				contentFit="contain"
			/>

			<Text className="text-5xl text-primary-foreground font-extrabold mb-16 leading-tight opacity-90">
				TRULY PRIVATE PHOTO STORAGE ON CLOUD
			</Text>

			<View className="w-full mb-12">
				<Button
					variant="default"
					size="lg"
					onPress={() => router.push('/login')}
				>
					Log In
				</Button>

				<Button
					variant="link"
					className="mt-2"
					onPress={() => router.push('/login')}
					textClassName="text-primary-foreground font-semibold text-lg"
				>
					Get Started
				</Button>
			</View>
		</View>
	)
}

export default Onboarding


const styles = StyleSheet.create({
	image: {
		height: 240,
		width: 240,
		marginBottom: 32
	}
})
