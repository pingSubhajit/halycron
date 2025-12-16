import React from 'react'
import {Pressable, Text, View} from 'react-native'
import {Album} from '../lib/album-types'
import {EyeOff} from '../../lib/icons/EyeOff'
import {Lock} from '../../lib/icons/Lock'
import {FolderOpen} from '../../lib/icons/FolderOpen'
import {darkTheme} from '../theme/theme'

interface AlbumCardProps {
	album: Album
	onPress: (album: Album) => void
}

export const AlbumCard: React.FC<AlbumCardProps> = ({album, onPress}) => {
	const photoCount = album._count?.photos ?? 0

	return (
		<Pressable
			onPress={() => onPress(album)}
			style={({pressed}) => ({
				opacity: pressed ? 0.7 : 1,
				flex: 1,
				margin: 6
			})}
		>
			<View
				style={{
					backgroundColor: darkTheme.card,
					overflow: 'hidden',
					borderWidth: 1,
					borderColor: darkTheme.border
				}}
			>
				{/* Album Cover */}
				<View
					style={{
						aspectRatio: 4 / 3,
						backgroundColor: darkTheme.muted,
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					{album.isSensitive || album.isProtected ? (
						// Sensitive/Protected album - show icons
						<View
							style={{
								flex: 1,
								justifyContent: 'center',
								alignItems: 'center',
								gap: 8
							}}
						>
							<View style={{flexDirection: 'row', gap: 12}}>
								{album.isSensitive && (
									<EyeOff size={32} color={darkTheme.mutedForeground} />
								)}
								{album.isProtected && (
									<Lock size={32} color={darkTheme.mutedForeground} />
								)}
							</View>
							<Text
								style={{
									color: darkTheme.mutedForeground,
									fontSize: 12,
									marginTop: 4
								}}
							>
								{album.isSensitive && album.isProtected
									? 'Sensitive & Protected'
									: album.isSensitive
										? 'Sensitive'
										: 'Protected'}
							</Text>
						</View>
					) : (
						// Regular album - show folder icon
						<FolderOpen size={48} color={darkTheme.mutedForeground} />
					)}
				</View>

				{/* Album Info - simplified, no status badges */}
				<View style={{padding: 12}}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between'
						}}
					>
						<Text
							style={{
								color: darkTheme.foreground,
								fontSize: 16,
								fontWeight: '600',
								flex: 1
							}}
							numberOfLines={1}
						>
							{album.name}
						</Text>
						<View
							style={{
								backgroundColor: darkTheme.muted,
								paddingHorizontal: 8,
								paddingVertical: 2,
								marginLeft: 8
							}}
						>
							<Text
								style={{
									color: darkTheme.mutedForeground,
									fontSize: 12,
									fontWeight: '500'
								}}
							>
								{photoCount}
							</Text>
						</View>
					</View>
				</View>
			</View>
		</Pressable>
	)
}
