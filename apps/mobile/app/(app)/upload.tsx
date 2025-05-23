import {SafeAreaView} from 'react-native-safe-area-context'
import {Text, View} from 'react-native'

const UploadScreen = () => {
	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="p-6">
				<Text className="text-primary-foreground text-2xl font-bold mb-6">Welcome to Upload</Text>
			</View>
		</SafeAreaView>
	)
}

export default UploadScreen
