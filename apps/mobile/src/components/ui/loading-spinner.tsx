import React, {useEffect} from 'react'
import {View} from 'react-native'
import Animated, {useAnimatedStyle, useSharedValue, withRepeat, withTiming} from 'react-native-reanimated'

interface LoadingSpinnerProps {
	size?: number
	color?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
	size = 20,
	color = 'white'
}) => {
	const rotation = useSharedValue(0)

	useEffect(() => {
		rotation.value = withRepeat(
			withTiming(360, {duration: 1000}),
			-1,
			false
		)
	}, [rotation])

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{rotate: `${rotation.value}deg`}]
		}
	})

	return (
		<Animated.View style={[animatedStyle]}>
			<View style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				borderWidth: 2,
				borderColor: color,
				borderTopColor: 'transparent'
			}}/>
		</Animated.View>
	)
}

export default LoadingSpinner
