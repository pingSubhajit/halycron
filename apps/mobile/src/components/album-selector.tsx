import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ActivityIndicator, Pressable, Text, View} from 'react-native'
import BottomSheet, {BottomSheetBackdrop, BottomSheetFlatList} from '@gorhom/bottom-sheet'
import {useAllAlbums, useAddPhotosToAlbum, useRemovePhotosFromAlbum} from '../hooks/use-albums'
import {Album} from '../lib/album-types'
import {Photo} from '../lib/types'
import {Button} from './ui/button'
import {Check} from '../../lib/icons/Check'
import {EyeOff} from '../../lib/icons/EyeOff'
import {Lock} from '../../lib/icons/Lock'
import {FolderOpen} from '../../lib/icons/FolderOpen'
import {Plus} from '../../lib/icons/Plus'
import {darkTheme} from '../theme/theme'
import {AlbumCreateSheet} from './album-create-sheet'


interface AlbumSelectorProps {
	photo: Photo
	isOpen: boolean
	onClose: () => void
}

const AlbumItem: React.FC<{
	album: Album
	isSelected: boolean
	onToggle: () => void
	isPending: boolean
}> = ({album, isSelected, onToggle, isPending}) => (
	<Pressable
		onPress={onToggle}
		disabled={isPending}
		className="flex-row items-center py-3.5 px-4 mb-2"
		style={({pressed}) => ({
			opacity: pressed || isPending ? 0.6 : 1,
			backgroundColor: isSelected ? `${darkTheme.primary}15` : 'transparent'
		})}
	>
		{/* Checkbox - boxy design */}
		<View
			style={{
				width: 20,
				height: 20,
				borderWidth: 2,
				borderColor: isSelected ? darkTheme.primary : darkTheme.mutedForeground,
				backgroundColor: isSelected ? darkTheme.primary : 'transparent',
				justifyContent: 'center',
				alignItems: 'center',
				marginRight: 12
			}}
		>
			{isSelected && <Check size={12} color={darkTheme.dark} />}
		</View>

		{/* Album Info */}
		<View className="flex-1">
			<Text
				className="text-primary-foreground text-base font-medium"
				numberOfLines={1}
			>
				{album.name}
			</Text>
			<Text className="text-primary-foreground opacity-60 text-xs mt-0.5">
				{album._count?.photos ?? 0} photos
			</Text>
		</View>

		{/* Status Badges */}
		<View className="flex-row gap-1.5">
			{album.isSensitive && <EyeOff size={16} color={darkTheme.primary} />}
			{album.isProtected && <Lock size={16} color={darkTheme.primary} />}
		</View>

		{/* Loading indicator */}
		{isPending && (
			<ActivityIndicator
				size="small"
				color={darkTheme.primary}
				style={{marginLeft: 8}}
			/>
		)}
	</Pressable>
)

export const AlbumSelector: React.FC<AlbumSelectorProps> = ({
	photo,
	isOpen,
	onClose
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const {data: albums, isLoading} = useAllAlbums()
	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
	const [isSelectorHidden, setIsSelectorHidden] = useState(false)
	const [pendingAlbumId, setPendingAlbumId] = useState<string | null>(null)
	
	// Optimistic state - tracks which albums the photo is in (with optimistic updates)
	// This is initialized when the sheet opens and becomes the source of truth during the session
	const [optimisticAlbumIds, setOptimisticAlbumIds] = useState<Set<string>>(
		new Set(photo.albums?.map((a) => a.id) || [])
	)

	// Reset optimistic state when sheet opens (sync with latest photo.albums)
	useEffect(() => {
		if (isOpen) {
			setOptimisticAlbumIds(new Set(photo.albums?.map((a) => a.id) || []))
			setPendingAlbumId(null)
			setIsSelectorHidden(false)
		}
	}, [isOpen, photo.albums])

	const {mutate: addToAlbum} = useAddPhotosToAlbum(photo.albums?.map((a) => a.id))
	const {mutate: removeFromAlbum} = useRemovePhotosFromAlbum(
		photo.albums?.map((a) => a.id)
	)

	// Snap points - increased for better visibility
	const snapPoints = useMemo(() => ['40%'], [])

	const handleToggleAlbum = useCallback(
		(album: Album) => {
			const isInAlbum = optimisticAlbumIds.has(album.id)
			setPendingAlbumId(album.id)

			// Optimistic update - update UI immediately
			setOptimisticAlbumIds((prev) => {
				const next = new Set(prev)
				if (isInAlbum) {
					next.delete(album.id)
				} else {
					next.add(album.id)
				}
				return next
			})

			if (isInAlbum) {
				removeFromAlbum(
					{albumId: album.id, photoIds: [photo.id]},
					{
						onSettled: () => {
							// Clear pending state but don't touch optimistic state
							setPendingAlbumId(null)
						},
						onError: () => {
							// Revert optimistic update on error
							setOptimisticAlbumIds((prev) => {
								const next = new Set(prev)
								next.add(album.id)
								return next
							})
						}
					}
				)
			} else {
				addToAlbum(
					{albumId: album.id, photoIds: [photo.id]},
					{
						onSettled: () => {
							// Clear pending state but don't touch optimistic state
							setPendingAlbumId(null)
						},
						onError: () => {
							// Revert optimistic update on error
							setOptimisticAlbumIds((prev) => {
								const next = new Set(prev)
								next.delete(album.id)
								return next
							})
						}
					}
				)
			}
		},
		[photo.id, optimisticAlbumIds, addToAlbum, removeFromAlbum]
	)

	// Open create sheet - hide selector first
	const handleOpenCreateSheet = useCallback(() => {
		setIsSelectorHidden(true)
		// Small delay to let the selector animate out
		setTimeout(() => {
			setIsCreateSheetOpen(true)
		}, 100)
	}, [])

	// Handle create sheet close - show selector again
	const handleCreateSheetClose = useCallback(() => {
		setIsCreateSheetOpen(false)
		// Small delay before showing selector again
		setTimeout(() => {
			setIsSelectorHidden(false)
		}, 100)
	}, [])

	const handleCreateSuccess = useCallback(() => {
		// The new album will be added through React Query invalidation
	}, [])

	// Handle sheet close
	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close()
		onClose()
	}, [onClose])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1 && !isSelectorHidden) {
			onClose()
		}
	}, [onClose, isSelectorHidden])

	// Backdrop component
	const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				onPress={handleClose}
			/>
		),
		[handleClose]
	)

	const renderAlbumItem = useCallback(
		({item}: {item: Album}) => (
			<AlbumItem
				album={item}
				isSelected={optimisticAlbumIds.has(item.id)}
				onToggle={() => handleToggleAlbum(item)}
				isPending={pendingAlbumId === item.id}
			/>
		),
		[optimisticAlbumIds, handleToggleAlbum, pendingAlbumId]
	)

	const renderEmptyComponent = useCallback(() => (
		<View className="flex-1 justify-center items-center py-10 px-6">
			<FolderOpen size={48} color={darkTheme.mutedForeground} />
			<Text className="text-primary-foreground text-base font-medium mt-4 text-center">
				No albums yet
			</Text>
			<Text className="text-primary-foreground opacity-60 text-sm mt-2 text-center">
				Create your first album to organize this photo
			</Text>
			<Button
				variant="default"
				onPress={handleOpenCreateSheet}
				className="mt-5 h-12 px-6"
			>
				<Text className="text-primary-foreground font-medium">Create Album</Text>
			</Button>
		</View>
	), [handleOpenCreateSheet])

	const renderLoadingComponent = useCallback(() => (
		<View className="flex-1 justify-center items-center py-10">
			<ActivityIndicator size="large" color={darkTheme.primary} />
			<Text className="text-primary-foreground opacity-60 mt-3">
				Loading albums...
			</Text>
		</View>
	), [])

	if (!isOpen) return null

	return (
		<>
			{/* Album Selector Sheet */}
			{!isSelectorHidden && (
				<BottomSheet
					ref={bottomSheetRef}
					index={0}
					snapPoints={snapPoints}
					onChange={handleSheetChanges}
					enablePanDownToClose={true}
					enableDynamicSizing={false}
					backgroundStyle={{backgroundColor: darkTheme.dark}}
					handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
					backdropComponent={renderBackdrop}
				>
					<View className="flex-1 px-4 pb-6">
						{/* Header */}
						<View className="flex-row justify-between items-center mb-4">
							<Text className="text-primary-foreground text-xl font-semibold">
								Add to Album
							</Text>
							<Pressable
								onPress={handleOpenCreateSheet}
								style={({pressed}) => ({
									opacity: pressed ? 0.8 : 1,
									borderWidth: 1,
									borderColor: darkTheme.primary,
									backgroundColor: `${darkTheme.primary}15`,
									padding: 8
								})}
							>
								<Plus size={20} color={darkTheme.primary} />
							</Pressable>
						</View>

						{/* Album List */}
						{isLoading ? (
							renderLoadingComponent()
						) : !albums || albums.length === 0 ? (
							renderEmptyComponent()
						) : (
							<BottomSheetFlatList
								data={albums}
								keyExtractor={(item) => item.id}
								renderItem={renderAlbumItem}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{paddingBottom: 20}}
							/>
						)}
					</View>
				</BottomSheet>
			)}

			{/* Create Album Sheet */}
			<AlbumCreateSheet
				isOpen={isCreateSheetOpen}
				onClose={handleCreateSheetClose}
				onSuccess={handleCreateSuccess}
			/>
		</>
	)
}
