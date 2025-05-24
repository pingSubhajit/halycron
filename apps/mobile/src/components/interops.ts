import {Image as ExpoImage} from 'expo-image'
import {BlurView as ExpoBlurView} from 'expo-blur'
import {cssInterop} from 'nativewind'

export const Image = cssInterop(ExpoImage, {
	className: 'style'
})

export const BlurView = cssInterop(ExpoBlurView, {
	className: 'style'
})
