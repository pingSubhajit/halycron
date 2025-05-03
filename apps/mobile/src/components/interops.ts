import {Image as ExpoImage} from 'expo-image'
import {cssInterop} from 'nativewind'

export const Image = cssInterop(ExpoImage, {
	className: 'style'
})
