import {Text, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'

const Native = () => (
	<View className="flex-1 bg-neutral-950 items-center justify-center">
		<Text className="text-red-500 text-xl">Native</Text>
		<StatusBar style="auto"/>
	</View>
)
export default Native
