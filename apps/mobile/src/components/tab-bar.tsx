import React from 'react'
import {Text, TouchableOpacity, View} from 'react-native'
import {usePathname, useRouter} from 'expo-router'
import {BlurView} from '@/src/components/interops'
import Ionicons from '@expo/vector-icons/Ionicons'

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
		<BlurView
			tint="dark"
			experimentalBlurMethod="dimezisBlurView"
			className={`flex-row rounded-full mx-auto overflow-hidden ${className}`}
			style={{
				position: 'absolute',
				bottom: 20,
				left: '10%',
				right: '10%',
				width: '80%',
				paddingVertical: 12,
				paddingHorizontal: 8,
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
	)
}
