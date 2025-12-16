import * as React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import Animated, {useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming} from 'react-native-reanimated'
import {cn} from '@/lib/utils'

const duration = 1000

function Skeleton({
	className,
	style,
	...props
}: Omit<React.ComponentPropsWithoutRef<typeof Animated.View>, 'style'> & {
	style?: StyleProp<ViewStyle>
}) {
	const sv = useSharedValue(1)

	React.useEffect(() => {
		sv.value = withRepeat(
			withSequence(withTiming(0.5, {duration}), withTiming(1, {duration})),
			-1
		)
	}, [])

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: sv.value
	}))

	return (
		<Animated.View
			style={[style, animatedStyle]}
			className={cn('', className)}
			{...props}
		/>
	)
}

export {Skeleton}
