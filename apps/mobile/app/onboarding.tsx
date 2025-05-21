import React from 'react'
import {StyleSheet, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {Button} from '@/src/components/ui/button'
import {useTheme} from '@/src/theme/ThemeProvider'
import {useRouter} from 'expo-router'
import {Image} from '@/src/components/interops'
import logo from '@halycron/ui/media/logo.svg'
import {Text} from '@/src/components/ui/text'
import banner from '@halycron/ui/media/banner_square.png'

const Onboarding = () => {
	const {theme} = useTheme()
	const router = useRouter()

	return (
		<View
			className="flex-1 justify-end"
			style={{backgroundColor: '#070607'}}
		>
			<StatusBar style="dark"/>

			<Image
				className="w-[100%] h-[80%] absolute top-0 mx-auto"
				source={banner}
				contentFit="cover"
			/>

			<View className="flex-1 justify-end px-6">
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
						className="h-12"
						onPress={() => router.push('/login')}
					>
						<Text className="text-base">Log In</Text>
					</Button>

					<Button
						variant="link"
						className="mt-2"
						onPress={() => router.push('/login')}
					>
						<Text className="text-primary-foreground font-semibold text-base">Get Started</Text>
					</Button>
				</View>
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
