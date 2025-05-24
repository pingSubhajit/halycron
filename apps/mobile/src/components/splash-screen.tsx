import {Image} from '@/src/components/interops'
import logo from '@halycron/ui/media/logo.svg'
import {View} from 'react-native'
import React from 'react'
import {SystemBars} from 'react-native-edge-to-edge'

const SplashScreen = () => {
	return (
		<View className="flex-1 justify-center items-center " style={{backgroundColor: '#0a0a0a'}}>
			<SystemBars style="light"/>

			<Image
				className="w-40 h-10"
				source={logo}
				contentFit="contain"
			/>
		</View>
	)
}

export default SplashScreen
