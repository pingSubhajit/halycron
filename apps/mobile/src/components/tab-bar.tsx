import React from 'react'
import {Text, TouchableOpacity, View} from 'react-native'
import {usePathname, useRouter} from 'expo-router'
import {BlurView} from '@/src/components/interops'
import Ionicons from '@expo/vector-icons/Ionicons'
import {darkTheme} from '@/src/theme/theme'

interface TabBarProps {
	className?: string
}

export const TabBar: React.FC<TabBarProps> = ({className}) => {
	const router = useRouter()
	const pathname = usePathname()

	// Hide tab bar on modal screens
	const shouldHideTabBar = pathname.includes('/upload')

	const handleTabPress = (route: string) => {
		router.push(route as any)
	}

	const isActive = (route: string) => {
		if (route === '/') {
			return pathname === '/' || pathname === '/index'
		}
		return pathname === route
	}

	if (shouldHideTabBar) {
		return null
	}

	return (
		<View style={{position: 'relative'}}>
			<BlurView
				tint="dark"
				experimentalBlurMethod="dimezisBlurView"
				className={`flex-row rounded-full mx-auto overflow-hidden ${className}`}
				style={{
					position: 'absolute',
					bottom: 20,
					left: '15%',
					right: '15%',
					width: '70%',
					paddingVertical: 12,
					paddingHorizontal: 20,
					elevation: 8,
					borderWidth: 1,
					borderColor: 'rgba(0, 0, 0, 0.1)'
				}}
			>
				<TouchableOpacity
					key={'gallery'}
					onPress={() => handleTabPress('/')}
					className="flex-1 justify-center items-center py-1"
					activeOpacity={0.7}
				>
					<View className="items-center">
						<Ionicons name="images" size={24} color={isActive('/')
							? 'white'
							: '#bcbcbc'}/>
						<Text
							className={`text-sm mt-2 font-medium text-primary-foreground ${
								isActive('/')
									? 'opacity-100'
									: 'opacity-70'
							}`}
						>
							Gallery
						</Text>
					</View>
				</TouchableOpacity>

				{/* Spacer for the middle upload button */}
				<View className="flex-1"/>

				<TouchableOpacity
					key={'albums'}
					onPress={() => handleTabPress('/albums')}
					className="flex-1 justify-center items-center py-2"
					activeOpacity={0.7}
				>
					<View className="items-center">
						<Ionicons name="albums" size={24} color={isActive('/albums')
							? 'white'
							: '#bcbcbc'}/>
						<Text
							className={`text-sm mt-2 font-medium text-primary-foreground ${
								isActive('/albums')
									? 'opacity-100'
									: 'opacity-70'
							}`}
						>
							Albums
						</Text>
					</View>
				</TouchableOpacity>
			</BlurView>

			{/* Plus Upload Button */}
			<TouchableOpacity
				onPress={() => handleTabPress('/upload')}
				activeOpacity={0.8}
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
			</TouchableOpacity>
		</View>
	)
}
