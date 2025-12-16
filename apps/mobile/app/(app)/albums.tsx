import React, {useState} from 'react'
import {
	Dimensions,
	FlatList,
	Pressable,
	RefreshControl,
	Text,
	View
} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useRouter} from 'expo-router'
import {useAllAlbums} from '@/src/hooks/use-albums'
import {AlbumCard} from '@/src/components/album-card'
import {AlbumCreateSheet} from '@/src/components/album-create-sheet'
import {Album} from '@/src/lib/album-types'
import {FolderOpen} from '@/lib/icons/FolderOpen'
import {Plus} from '@/lib/icons/Plus'
import {darkTheme} from '@/src/theme/theme'
import {Skeleton} from '@/src/components/ui/skeleton'

const {width: screenWidth} = Dimensions.get('window')
const NUM_COLUMNS = 2

// Skeleton card for loading state
const AlbumCardSkeleton = () => (
	<View
		style={{
			flex: 1,
			margin: 6
		}}
	>
		<View
			style={{
				backgroundColor: darkTheme.card,
				overflow: 'hidden',
				borderWidth: 1,
				borderColor: darkTheme.border
			}}
		>
			{/* Cover Skeleton */}
			<Skeleton
				style={{
					aspectRatio: 4 / 3,
					width: '100%',
					backgroundColor: darkTheme.muted
				}}
			/>
			{/* Info Skeleton */}
			<View style={{padding: 12}}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between'
					}}
				>
					<Skeleton
						style={{
							height: 18,
							width: '60%',
							backgroundColor: darkTheme.muted
						}}
					/>
					<Skeleton
						style={{
							height: 20,
							width: 28,
							backgroundColor: darkTheme.muted
						}}
					/>
				</View>
			</View>
		</View>
	</View>
)

const EmptyState = ({onCreatePress}: {onCreatePress: () => void}) => (
	<View
		style={{
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 32,
			minHeight: 400
		}}
	>
		<View
			style={{
				backgroundColor: `${darkTheme.muted}`,
				borderRadius: 24,
				padding: 24,
				marginBottom: 24
			}}
		>
			<FolderOpen size={48} color={darkTheme.mutedForeground} />
		</View>
		<Text
			style={{
				color: darkTheme.foreground,
				fontSize: 20,
				fontWeight: '600',
				marginBottom: 8,
				textAlign: 'center'
			}}
		>
			No albums yet
		</Text>
		<Text
			style={{
				color: darkTheme.mutedForeground,
				fontSize: 14,
				textAlign: 'center',
				lineHeight: 20,
				marginBottom: 24
			}}
		>
			Create your first album to start organizing your memories
		</Text>
		<Pressable
			onPress={onCreatePress}
			style={({pressed}) => ({
				backgroundColor: darkTheme.primary,
				paddingHorizontal: 24,
				paddingVertical: 12,
				borderRadius: 12,
				opacity: pressed ? 0.8 : 1
			})}
		>
			<Text
				style={{
					color: darkTheme.dark,
					fontSize: 16,
					fontWeight: '600'
				}}
			>
				Create Album
			</Text>
		</Pressable>
	</View>
)

const ErrorState = ({error, onRetry}: {error: string; onRetry: () => void}) => (
	<View
		style={{
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 32,
			minHeight: 400
		}}
	>
		<Text
			style={{
				color: darkTheme.foreground,
				fontSize: 16,
				textAlign: 'center',
				marginBottom: 16
			}}
		>
			{error || 'Something went wrong loading your albums'}
		</Text>
		<Pressable
			onPress={onRetry}
			style={({pressed}) => ({
				backgroundColor: darkTheme.muted,
				paddingHorizontal: 24,
				paddingVertical: 12,
				borderRadius: 12,
				opacity: pressed ? 0.8 : 1
			})}
		>
			<Text
				style={{
					color: darkTheme.foreground,
					fontSize: 14,
					fontWeight: '500'
				}}
			>
				Try Again
			</Text>
		</Pressable>
	</View>
)

const Albums = () => {
	const router = useRouter()
	const {data: albums, isLoading, error, refetch, isRefetching} = useAllAlbums()
	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)

	const handleAlbumPress = (album: Album) => {
		router.push({
			pathname: '/album/[id]',
			params: {id: album.id, name: album.name}
		})
	}

	const handleCreatePress = () => {
		setIsCreateSheetOpen(true)
	}

	const renderHeader = () => (
		<View className="mt-16 py-6 px-2 flex-1">
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'flex-start'
				}}
			>
				<View className="flex-1 mr-4">
					<Text className="text-primary-foreground opacity-80 text-3xl font-semibold mb-2">Your</Text>
					<Text className="text-primary-foreground text-6xl font-bold mb-4">Albums</Text>
				</View>
				<Pressable
					onPress={handleCreatePress}
					style={({pressed}) => ({
						backgroundColor: darkTheme.primary,
						width: 44,
						height: 44,
						borderRadius: 22,
						justifyContent: 'center',
						alignItems: 'center',
						marginTop: 8,
						opacity: pressed ? 0.8 : 1
					})}
				>
					<Plus size={24} color={darkTheme.dark} />
				</Pressable>
			</View>

			{!isLoading && albums && albums.length > 0 && (
				<Text
					style={{
						color: darkTheme.mutedForeground,
						fontSize: 14,
						marginTop: 12
					}}
				>
					{albums.length} {albums.length === 1 ? 'album' : 'albums'}
				</Text>
			)}
		</View>
	)

	const renderAlbumItem = ({item, index}: {item: Album; index: number}) => (
		<View
			style={{
				width: (screenWidth - 48) / NUM_COLUMNS,
				paddingLeft: index % NUM_COLUMNS === 0 ? 0 : 6,
				paddingRight: index % NUM_COLUMNS === NUM_COLUMNS - 1 ? 0 : 6
			}}
		>
			<AlbumCard album={item} onPress={handleAlbumPress} />
		</View>
	)

	const renderSkeletonItem = ({index}: {index: number}) => (
		<View
			style={{
				width: (screenWidth - 48) / NUM_COLUMNS,
				paddingLeft: index % NUM_COLUMNS === 0 ? 0 : 6,
				paddingRight: index % NUM_COLUMNS === NUM_COLUMNS - 1 ? 0 : 6
			}}
		>
			<AlbumCardSkeleton />
		</View>
	)

	// Loading state with skeleton
	if (isLoading && !albums) {
		return (
			<SafeAreaView
				style={{flex: 1, backgroundColor: darkTheme.background}}
				edges={{bottom: 'off'}}
			>
				<FlatList
					data={[0, 1, 2, 3, 4, 5]}
					renderItem={renderSkeletonItem}
					keyExtractor={(item) => `skeleton-${item}`}
					numColumns={NUM_COLUMNS}
					contentContainerStyle={{
						paddingHorizontal: 18,
						paddingBottom: 120
					}}
					ListHeaderComponent={renderHeader}
					showsVerticalScrollIndicator={false}
				/>
			</SafeAreaView>
		)
	}

	// Error state
	if (error) {
		return (
			<SafeAreaView
				style={{flex: 1, backgroundColor: darkTheme.background}}
				edges={{bottom: 'off'}}
			>
				<FlatList
					data={[]}
					renderItem={() => null}
					ListHeaderComponent={renderHeader}
					ListEmptyComponent={<ErrorState error={error.message} onRetry={refetch} />}
					showsVerticalScrollIndicator={false}
				/>
			</SafeAreaView>
		)
	}

	// Empty state
	if (!albums || albums.length === 0) {
		return (
			<SafeAreaView
				style={{flex: 1, backgroundColor: darkTheme.background}}
				edges={{bottom: 'off'}}
			>
				<FlatList
					data={[]}
					renderItem={() => null}
					ListHeaderComponent={renderHeader}
					ListEmptyComponent={<EmptyState onCreatePress={handleCreatePress} />}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={refetch}
							tintColor={darkTheme.primary}
						/>
					}
					showsVerticalScrollIndicator={false}
				/>

				<AlbumCreateSheet
					isOpen={isCreateSheetOpen}
					onClose={() => setIsCreateSheetOpen(false)}
				/>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView
			style={{flex: 1, backgroundColor: darkTheme.background}}
			edges={{bottom: 'off'}}
		>
			<FlatList
				data={albums}
				renderItem={renderAlbumItem}
				keyExtractor={(item) => item.id}
				numColumns={NUM_COLUMNS}
				contentContainerStyle={{
					paddingHorizontal: 18,
					paddingBottom: 120
				}}
				ListHeaderComponent={renderHeader}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={refetch}
						tintColor={darkTheme.primary}
					/>
				}
				showsVerticalScrollIndicator={false}
			/>

			<AlbumCreateSheet
				isOpen={isCreateSheetOpen}
				onClose={() => setIsCreateSheetOpen(false)}
			/>
		</SafeAreaView>
	)
}

export default Albums
