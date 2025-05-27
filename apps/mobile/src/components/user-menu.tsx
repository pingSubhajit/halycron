import React, {useState} from 'react'
import {Platform, Pressable, Text, View} from 'react-native'
import {useSession} from './session-provider'
import {Avatar} from './avatar'
import {Feather} from '@expo/vector-icons'
import {BlurView} from 'expo-blur'

interface UserMenuProps {
	onClose?: () => void
}

export const UserMenu = ({onClose}: UserMenuProps) => {
	const {user, signOut} = useSession()
	const [signingOut, setSigningOut] = useState<boolean>(false)

	const handleLogout = async () => {
		setSigningOut(true)
		await signOut()
		setSigningOut(false)
		onClose?.()
	}

	// Create a more reliable avatar URL with PNG format
	const getAvatarUrl = () => {
		if (!user?.email) return undefined
		return `https://api.dicebear.com/7.x/thumbs/png?seed=${encodeURIComponent(user.email)}&size=128`
	}

	// Use dimezisBlurView experimental method on Android
	const experimentalBlurMethod = Platform.OS === 'android' ? 'dimezisBlurView' : undefined

	return (
		<View
			style={{
				// Platform-specific shadow styling
				...Platform.select({
					ios: {
						shadowColor: '#000',
						shadowOffset: {width: 0, height: 5},
						shadowOpacity: 0.35,
						shadowRadius: 8
					},
					android: {
						elevation: 24
					}
				}),
				borderRadius: 8,
				overflow: 'hidden'
			}}
		>
			<BlurView
				intensity={85}
				tint="dark"
				style={{borderRadius: 8, overflow: 'hidden'}}
				experimentalBlurMethod={experimentalBlurMethod as any}
			>
				<View
					className="bg-card/80 w-full p-4 rounded-lg"
					style={{borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)'}}
				>
					{/* User info section */}
					<View className="flex-row items-center gap-3 mb-4 pb-4">
						<Avatar
							size={40}
							className="h-10 w-10 rounded-full"
							imageUrl={getAvatarUrl()}
							fallback={<Feather name="user" size={20} color="#fff"/>}
						/>
						<View className="flex-1" style={{marginLeft: 12}}>
							<Text className="text-primary-foreground font-semibold text-lg">
								{user?.name || 'One moment...'}
							</Text>
							<Text className="text-primary-foreground opacity-60 truncate">
								{user?.email || 'One moment...'}
							</Text>
						</View>
					</View>

					{/* Menu options */}
					<Pressable
						onPress={handleLogout}
						className="flex-row items-center justify-between py-3"
					>
						<Text className="text-primary-foreground text-base">
							{!signingOut ? 'Sign out' : 'Signing out...'}
						</Text>
						<Feather name="log-out" size={18} color="#888"/>
					</Pressable>
				</View>
			</BlurView>
		</View>
	)
}
