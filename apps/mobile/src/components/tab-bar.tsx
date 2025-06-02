import React, {useEffect, useRef} from 'react'
import {Animated, Easing, Text, View} from 'react-native'
import {Link, usePathname} from 'expo-router'
import {BlurView} from '@/src/components/interops'
import Ionicons from '@expo/vector-icons/Ionicons'
import {darkTheme} from '@/src/theme/theme'

interface TabBarProps {
	className?: string
}

export const TabBar: React.FC<TabBarProps> = ({className}) => {
	const pathname = usePathname()
	const slideAnim = useRef(new Animated.Value(0)).current

	// Hide tab bar on modal screens
	const shouldHideTabBar = pathname.includes('/upload') || pathname.includes('/shared')

	useEffect(() => {
		if (shouldHideTabBar) {
			// Slide out animation
			Animated.timing(slideAnim, {
				toValue: 120, // Slide down by 120 pixels (enough to hide the tab bar)
				duration: 200,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true
			}).start()
		} else {
			// Slide in animation
			Animated.timing(slideAnim, {
				toValue: 0, // Slide back to the original position
				duration: 300,
				delay: 200,
				easing: Easing.out(Easing.back(1.2)), // Bouncy slide-in effect
				useNativeDriver: true
			}).start()
		}
	}, [shouldHideTabBar, slideAnim])

	const isActive = (route: string) => {
		if (route === '/') {
			return pathname === '/' || pathname === '/index'
		}
		return pathname === route
	}

	return (
		<Animated.View
			style={{
				position: 'relative',
				transform: [{translateY: slideAnim}]
			}}
		>
			<BlurView
				tint="dark"
				experimentalBlurMethod="dimezisBlurView"
				className={`flex-row rounded-full mx-auto overflow-hidden justify-between items-center ${className}`}
				style={{
					position: 'absolute',
					bottom: 20,
					left: '18%',
					right: '18%',
					width: '64%',
					paddingVertical: 12,
					paddingHorizontal: 40,
					elevation: 8,
					borderWidth: 1,
					borderColor: 'rgba(0, 0, 0, 0.1)'
				}}
			>
				<Link
					href="/"
					replace
					className="justify-center items-center py-1"
				>
					<View className="items-center">
						<Ionicons name="images" size={25} color={isActive('/')
							? 'white'
							: '#bcbcbc'}/>
						<Text
							className={`text-sm mt-2 font-medium text-primary-foreground whitespace-nowrap ${
								isActive('/')
									? 'opacity-100'
									: 'opacity-70'
							}`}
						>
							Gallery
						</Text>
					</View>
				</Link>

				<Link
					href="/albums"
					replace
					className="justify-center items-center py-1"
				>
					<View className="items-center">
						<Ionicons name="albums" size={26} color={isActive('/albums')
							? 'white'
							: '#bcbcbc'}/>
						<Text
							className={`text-sm mt-1 font-medium text-primary-foreground whitespace-nowrap ${
								isActive('/albums')
									? 'opacity-100'
									: 'opacity-70'
							}`}
						>
							Albums
						</Text>
					</View>
				</Link>
			</BlurView>

			{/* Plus Upload Button */}
			<View
				style={{
					position: 'absolute',
					bottom: 56, // Elevated above the tab bar
					left: '50%',
					transform: [{translateX: -40}],
					width: 80,
					height: 80,
					borderRadius: 40,
					backgroundColor: darkTheme.dark,
					justifyContent: 'center',
					alignItems: 'center',
					elevation: 12,
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 6
					},
					shadowOpacity: 0.7,
					shadowRadius: 8,
					borderWidth: 3,
					borderColor: 'rgba(255, 255, 255, 0.1)'
				}}
			>
				<Link href="/upload">
					<View
						style={{
							width: 68,
							height: 68,
							borderRadius: 34,
							backgroundColor: darkTheme.background,
							justifyContent: 'center',
							alignItems: 'center'
						}}
					>
						<Ionicons name="add" size={36} color={darkTheme.primary}/>
					</View>
				</Link>
			</View>
		</Animated.View>
	)
}
