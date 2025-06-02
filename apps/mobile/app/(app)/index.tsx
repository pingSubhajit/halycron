import React, {useEffect, useRef, useState} from 'react'
import {Animated, Dimensions, Platform, Pressable, Text, TouchableWithoutFeedback, View} from 'react-native'
import {useSession} from '@/src/components/session-provider'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useAllPhotos} from '@/src/hooks/use-photos'
import {PhotoGallery} from '@/src/components/photo-gallery'
import {UserMenu} from '@/src/components/user-menu'
import {Avatar} from '@/src/components/avatar'
import {Feather} from '@expo/vector-icons'
import {router} from 'expo-router'
import {Button} from '@/src/components/ui/button'
import {useCloseAllDialogs} from '@/src/components/dialog-provider'

const Home = () => {
	const {user} = useSession()
	const [shouldLoadGallery, setShouldLoadGallery] = useState(false)
	const [showUserMenu, setShowUserMenu] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)
	const {width: screenWidth, height: screenHeight} = Dimensions.get('window')
	const {closeAllDialogs} = useCloseAllDialogs()

	// Animation values
	const menuOpacity = useRef(new Animated.Value(0)).current
	const menuTranslateY = useRef(new Animated.Value(-20)).current
	const overlayOpacity = useRef(new Animated.Value(0)).current

	// Reduce delay for better perceived performance
	useEffect(() => {
		const timer = setTimeout(() => {
			setShouldLoadGallery(true)
		}, 50) // Reduced from 100ms to 50ms

		return () => clearTimeout(timer)
	}, [])

	// Toggle menu with animation
	const toggleMenu = (show: boolean) => {
		if (show) {
			setShowUserMenu(true)
			setIsAnimating(true)
			// Show menu with animation
			Animated.parallel([
				Animated.timing(menuOpacity, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(menuTranslateY, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(overlayOpacity, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true
				})
			]).start(() => {
				setIsAnimating(false)
			})
		} else {
			setIsAnimating(true)
			// Hide menu with animation
			Animated.parallel([
				Animated.timing(menuOpacity, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(menuTranslateY, {
					toValue: -20,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(overlayOpacity, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true
				})
			]).start(() => {
				// Only hide the menu after animation completes
				setShowUserMenu(false)
				setIsAnimating(false)
			})
		}
	}

	// Handle menu toggling
	const handleMenuToggle = () => {
		toggleMenu(!showUserMenu)
	}

	// Handle menu close
	const handleCloseMenu = () => {
		toggleMenu(false)
	}

	// Create a more reliable avatar URL with PNG format
	const getAvatarUrl = () => {
		if (!user?.email) return undefined
		return `https://api.dicebear.com/7.x/thumbs/png?seed=${encodeURIComponent(user.email)}&size=128`
	}

	const renderHeader = () => (
		<View className="mt-16 p-6 flex-1">
			<View className="flex-row items-center justify-between mb-4">
				<View className="">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Welcome</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">{user?.name.split(' ')[0]}</Text>
				</View>

				<View className="relative">
					<Pressable onPress={handleMenuToggle}>
						<Avatar
							size={50}
							className="h-10 w-10 rounded-full"
							imageUrl={getAvatarUrl()}
							fallback={<Feather name="user" size={20} color="#fff"/>}
						/>
					</Pressable>
				</View>
			</View>
		</View>
	)

	// Should we render the menu? Yes if it's visible or animating
	const shouldRenderMenu = showUserMenu || isAnimating

	return (
		<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
			{shouldLoadGallery ? (
				<AsyncPhotoGallery headerComponent={renderHeader}/>
			) : (
				<View className="flex-1">
					{renderHeader()}
				</View>
			)}

			{/* Overlay to handle outside taps */}
			{shouldRenderMenu && (
				<Animated.View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: screenWidth,
						height: screenHeight,
						backgroundColor: 'rgba(0,0,0,0.1)',
						zIndex: Platform.OS === 'ios' ? 998 : undefined,
						elevation: Platform.OS === 'android' ? 998 : undefined,
						opacity: overlayOpacity
					}}
				>
					<TouchableWithoutFeedback onPress={handleCloseMenu}>
						<View style={{width: '100%', height: '100%'}}/>
					</TouchableWithoutFeedback>
				</Animated.View>
			)}

			{/* Render user menu separately with animation */}
			{shouldRenderMenu && (
				<Animated.View
					style={{
						position: 'absolute',
						top: 170,
						right: 16,
						width: 260,
						zIndex: Platform.OS === 'ios' ? 999 : undefined,
						elevation: Platform.OS === 'android' ? 999 : undefined,
						opacity: menuOpacity,
						transform: [{translateY: menuTranslateY}]
					}}
				>
					<UserMenu onClose={handleCloseMenu}/>
				</Animated.View>
			)}
		</SafeAreaView>
	)
}

// Separate component that handles the async photo loading
const AsyncPhotoGallery = ({headerComponent}: { headerComponent: () => React.ReactElement }) => {
	const {data: photos, isLoading, error, refetch, isRefetching} = useAllPhotos()

	const handleRefresh = () => {
		refetch()
	}

	return (
		<PhotoGallery
			photos={photos || []}
			isLoading={isLoading}
			error={error?.message || null}
			headerComponent={headerComponent}
			onRefresh={handleRefresh}
			isRefreshing={isRefetching}
		/>
	)
}

export default Home
