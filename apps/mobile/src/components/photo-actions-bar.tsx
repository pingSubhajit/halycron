import React, {useCallback, useEffect} from 'react'
import {Platform, Text, TouchableOpacity, View} from 'react-native'
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated'
import {Share} from '@/lib/icons/Share'
import {Download} from '@/lib/icons/Download'
import {Trash2} from '@/lib/icons/Trash2'
import {Photo} from '@/src/lib/types'
import {useDeleteConfirmation, useDownloadConfirmation, useShareOptions} from '@/src/components/dialog-provider'

interface PhotoActionsBarProps {
	isVisible: boolean
	currentPhoto: Photo | null
	onPhotoDeleted?: (photo: Photo) => void
}

const PhotoActionsBar: React.FC<PhotoActionsBarProps> = ({isVisible, currentPhoto, onPhotoDeleted}) => {
	const opacity = useSharedValue(isVisible ? 1 : 0)
	const {openDownloadConfirmation} = useDownloadConfirmation()
	const {openDeleteConfirmation} = useDeleteConfirmation()
	const {openShareOptions} = useShareOptions()

	// Animate opacity when visibility changes
	useEffect(() => {
		opacity.value = withTiming(isVisible ? 1 : 0, {
			duration: 100
		})
	}, [isVisible, opacity])

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value
		}
	})

	const handleActionPress = useCallback(async (action: string) => {
		if (!currentPhoto) return

		switch (action) {
		case 'Share':
			openShareOptions(currentPhoto)
			break
		case 'Download':
			openDownloadConfirmation(currentPhoto)
			break
		case 'Favorite':
			console.log('Favorite pressed for photo:', currentPhoto.id)
			// TODO: Implement favorite functionality
			break
		case 'Delete':
			openDeleteConfirmation(currentPhoto, onPhotoDeleted)
			break
		}
	}, [currentPhoto, openDownloadConfirmation, openDeleteConfirmation, openShareOptions, onPhotoDeleted])

	return (
		<Animated.View style={[
			{
				position: 'absolute',
				bottom: -55,
				left: 20,
				right: 20,
				marginBottom: Platform.OS === 'ios' ? 50 : 25,
				pointerEvents: isVisible ? 'box-none' : 'none' // Disable touches when not visible
			},
			animatedStyle
		]}>
			<View style={{
				flexDirection: 'row',
				justifyContent: 'space-around',
				alignItems: 'center'
			}}>
				<TouchableOpacity
					onPress={() => handleActionPress('Share')}
					className="p-3 items-center gap-2"
				>
					<Share size={20} color="white"/>
					<Text className="text-primary-foreground font-medium">Share</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => handleActionPress('Download')}
					className="p-3 items-center gap-2"
				>
					<Download size={20} color="white"/>
					<Text className="text-primary-foreground font-medium">Download</Text>
				</TouchableOpacity>

				{/* <TouchableOpacity*/}
				{/*	onPress={() => handleActionPress('Favorite')}*/}
				{/*	className="p-3 items-center gap-2"*/}
				{/* >*/}
				{/*	<Heart size={20} color="white"/>*/}
				{/*	<Text className="text-primary-foreground font-medium">Favourite</Text>*/}
				{/* </TouchableOpacity>*/}

				<TouchableOpacity
					onPress={() => handleActionPress('Delete')}
					className="p-3 items-center gap-2"
				>
					<Trash2 size={20} color="white"/>
					<Text className="text-primary-foreground font-medium">Trash</Text>
				</TouchableOpacity>
			</View>
		</Animated.View>
	)
}

export default PhotoActionsBar
