import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
	ActivityIndicator,
	Alert,
	Pressable,
	Text,
	TextInput,
	View
} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useLocalSearchParams, useRouter} from 'expo-router'
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet'
import {
	useAlbum,
	useAlbumPhotos,
	useDeleteAlbum,
	useUpdateAlbum,
	useLockAlbum
} from '@/src/hooks/use-albums'
import {PhotoGallery} from '@/src/components/photo-gallery'
import {PinVerificationDialog} from '@/src/components/pin-verification-dialog'
import {EyeOff} from '@/lib/icons/EyeOff'
import {Lock} from '@/lib/icons/Lock'
import {Trash2} from '@/lib/icons/Trash2'
import {Pencil} from '@/lib/icons/Pencil'
import {MoreVertical} from '@/lib/icons/MoreVertical'
import {darkTheme} from '@/src/theme/theme'
import {isAlbumVerified} from '@/src/lib/album-api'
import {Skeleton} from '@/src/components/ui/skeleton'
import {Button} from '@/src/components/ui/button'

// Warning color for sensitive albums
const warningColor = '#f59e0b'

interface AlbumActionsSheetProps {
	isOpen: boolean
	onClose: () => void
	onEdit: () => void
	onDelete: () => void
	onLock?: () => void
	isProtected: boolean
	isDeleting: boolean
}

const AlbumActionsSheet: React.FC<AlbumActionsSheetProps> = ({
	isOpen,
	onClose,
	onEdit,
	onDelete,
	onLock,
	isProtected,
	isDeleting
}) => {
	const bottomSheetRef = useRef<BottomSheet>(null)
	const snapPoints = useMemo(() => ['35%'], [])

	// Expand sheet when isOpen changes to true
	useEffect(() => {
		if (isOpen) {
			bottomSheetRef.current?.snapToIndex(0)
		} else {
			bottomSheetRef.current?.close()
		}
	}, [isOpen])

	// Handle sheet state changes
	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			onClose()
		}
	}, [onClose])

	// Handle close
	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close()
		onClose()
	}, [onClose])

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

	// Always render but control visibility via index
	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={isOpen ? 0 : -1}
			snapPoints={snapPoints}
			onChange={handleSheetChanges}
			enablePanDownToClose={true}
			enableDynamicSizing={false}
			backgroundStyle={{backgroundColor: darkTheme.dark}}
			handleIndicatorStyle={{backgroundColor: darkTheme.accent}}
			backdropComponent={renderBackdrop}
		>
			<View className="flex-1 px-6 pb-6">
				{/* Header */}
				<Text className="text-primary-foreground text-lg font-semibold mb-5">
					Album Options
				</Text>

				{/* Actions */}
				{/* Edit Name */}
				<Pressable
					onPress={() => {
						handleClose()
						setTimeout(onEdit, 300)
					}}
					className="flex-row items-center py-4"
					style={({pressed}) => ({
						opacity: pressed ? 0.6 : 1,
						borderBottomWidth: 1,
						borderBottomColor: darkTheme.border
					})}
				>
					<Pencil size={20} color={darkTheme.foreground} />
					<Text className="text-primary-foreground text-base ml-3">
						Edit Name
					</Text>
				</Pressable>

				{/* Lock Album */}
				{isProtected && onLock && (
					<Pressable
						onPress={() => {
							handleClose()
							setTimeout(onLock, 300)
						}}
						className="flex-row items-center py-4"
						style={({pressed}) => ({
							opacity: pressed ? 0.6 : 1,
							borderBottomWidth: 1,
							borderBottomColor: darkTheme.border
						})}
					>
						<Lock size={20} color={darkTheme.foreground} />
						<Text className="text-primary-foreground text-base ml-3">
							Lock Album
						</Text>
					</Pressable>
				)}

				{/* Delete Album */}
				<Pressable
					onPress={onDelete}
					disabled={isDeleting}
					className="flex-row items-center py-4"
					style={({pressed}) => ({opacity: pressed || isDeleting ? 0.6 : 1})}
				>
					{isDeleting ? (
						<ActivityIndicator size="small" color="#ef4444" />
					) : (
						<Trash2 size={20} color="#ef4444" />
					)}
					<Text className="text-base ml-3" style={{color: '#ef4444'}}>
						Delete Album
					</Text>
				</Pressable>
			</View>
		</BottomSheet>
	)
}

const AlbumDetailScreen = () => {
	const {id, name: passedName} = useLocalSearchParams<{id: string; name?: string}>()
	const router = useRouter()

	const {data: album, isLoading: albumLoading, error: albumError} = useAlbum(id)
	const {
		data: photos,
		isLoading: photosLoading,
		error: photosError,
		refetch: refetchPhotos,
		isRefetching
	} = useAlbumPhotos(id, !!(album && !album.requiresPin))

	const {mutate: deleteAlbum, isPending: isDeleting} = useDeleteAlbum()
	const {mutate: updateAlbum} = useUpdateAlbum()
	const {mutate: lockAlbum} = useLockAlbum()

	const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
	const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editedName, setEditedName] = useState('')

	// Use passed name initially, then album name when loaded
	const displayName = album?.name || passedName || 'Album'

	// Check if album needs PIN verification
	useEffect(() => {
		if (album?.isProtected && album.requiresPin && !isAlbumVerified(id)) {
			setIsPinDialogOpen(true)
		}
	}, [album, id])

	// Update edited name when album loads
	useEffect(() => {
		if (album) {
			setEditedName(album.name)
		} else if (passedName) {
			setEditedName(passedName)
		}
	}, [album, passedName])

	const handlePinVerified = useCallback(() => {
		setIsPinDialogOpen(false)
		// Refetch photos after PIN verification
		refetchPhotos()
	}, [refetchPhotos])

	const handleLockAlbum = useCallback(() => {
		Alert.alert(
			'Lock Album',
			'You will need to enter the PIN to access this album again.',
			[
				{text: 'Cancel', style: 'cancel'},
				{
					text: 'Lock',
					style: 'destructive',
					onPress: () => {
						lockAlbum(id)
						router.back()
					}
				}
			]
		)
	}, [id, lockAlbum, router])

	const handleDeleteAlbum = useCallback(() => {
		Alert.alert(
			'Delete Album',
			'Are you sure you want to delete this album? This action cannot be undone. Photos will not be deleted.',
			[
				{text: 'Cancel', style: 'cancel'},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						deleteAlbum(id, {
							onSuccess: () => {
								router.back()
							}
						})
					}
				}
			]
		)
	}, [id, deleteAlbum, router])

	const handleSaveName = useCallback(() => {
		if (!album || editedName.trim() === album.name) {
			setIsEditing(false)
			return
		}

		updateAlbum({
			id: album.id,
			name: editedName.trim()
		})
		setIsEditing(false)
	}, [album, editedName, updateAlbum])

	const handleCancelEdit = useCallback(() => {
		setEditedName(album?.name || passedName || '')
		setIsEditing(false)
	}, [album, passedName])

	const renderHeader = () => (
		<View className="mt-16 p-6 flex-1">
			{/* Single tier header */}
			<View className="flex-row items-start justify-between">
				{/* Album Title */}
				<View className="flex-1 mr-3">
					{isEditing ? (
						<TextInput
							value={editedName}
							onChangeText={setEditedName}
							style={{
								color: darkTheme.foreground,
								padding: 0,
								margin: 0,
								fontSize: 30,
								lineHeight: 38,
								fontWeight: '700'
							}}
							autoFocus
							onSubmitEditing={handleSaveName}
							onBlur={handleCancelEdit}
							returnKeyType="done"
							multiline
							scrollEnabled={false}
							blurOnSubmit
						/>
					) : albumLoading && !passedName ? (
						<Skeleton
							style={{
								height: 40,
								width: '70%',
								backgroundColor: darkTheme.muted
							}}
						/>
					) : (
						<Pressable onPress={() => album && setIsEditing(true)}>
							<Text
								style={{
									color: darkTheme.foreground,
									fontSize: 30,
									lineHeight: 38,
									fontWeight: '700'
								}}
								numberOfLines={2}
							>
								{displayName}
							</Text>
						</Pressable>
					)}

					{/* Album Info */}
					<View className="flex-row items-center gap-3 mt-3">
						{album?.isSensitive && (
							<View
								className="flex-row items-center gap-1 px-2.5 py-1.5"
								style={{backgroundColor: `${warningColor}20`}}
							>
								<EyeOff size={14} color={warningColor} />
								<Text className="text-xs font-medium" style={{color: warningColor}}>
									Sensitive
								</Text>
							</View>
						)}
						{!albumLoading && (
							<Text className="text-primary-foreground opacity-60 text-sm">
								{album?._count?.photos ?? photos?.length ?? 0} photos
							</Text>
						)}
					</View>
				</View>

				{/* Three dot menu */}
				<Pressable
					onPress={() => setIsActionsSheetOpen(true)}
					style={({pressed}) => ({
						padding: 8,
						marginTop: 4,
						opacity: pressed ? 0.6 : 1
					})}
					hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
				>
					<MoreVertical size={24} color={darkTheme.foreground} />
				</Pressable>
			</View>
		</View>
	)

	// Error state
	if (albumError && !passedName) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 justify-center items-center p-8">
					<Text className="text-primary-foreground text-base text-center mb-4">
						{albumError?.message || 'Album not found'}
					</Text>
					<Pressable
						onPress={() => router.back()}
						className="bg-muted px-6 py-3 rounded-xl"
						style={({pressed}) => ({opacity: pressed ? 0.8 : 1})}
					>
						<Text className="text-primary-foreground font-medium">Go Back</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		)
	}

	// PIN required state - render header for PIN gate
	const renderPinGateHeader = () => (
		<View className="mt-16 p-6">
			<View className="flex-row items-start justify-between">
				<View className="flex-1 mr-3">
					<Text
						style={{
							color: darkTheme.foreground,
							fontSize: 30,
							lineHeight: 38,
							fontWeight: '700'
						}}
						numberOfLines={2}
					>
						{displayName}
					</Text>

					{/* Album Info */}
					<View style={{marginTop: 12}}>
						<Text style={{color: darkTheme.mutedForeground, fontSize: 14}}>
							{album?._count?.photos ?? 0} photos
						</Text>
					</View>
				</View>

				{/* Three dot menu */}
				<Pressable
					onPress={() => setIsActionsSheetOpen(true)}
					style={({pressed}) => ({
						padding: 8,
						marginTop: 4,
						opacity: pressed ? 0.6 : 1
					})}
					hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
				>
					<MoreVertical size={24} color={darkTheme.foreground} />
				</Pressable>
			</View>
		</View>
	)

	if (album?.isProtected && album.requiresPin && !isAlbumVerified(id)) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
				{renderPinGateHeader()}

				<View className="flex-1 justify-center items-center p-8">
					<View className="rounded-2xl p-6 mb-6" style={{backgroundColor: darkTheme.muted}}>
						<Lock size={48} color={darkTheme.primary} />
					</View>
					<Text style={{color: darkTheme.mutedForeground, fontSize: 14, textAlign: 'center', marginBottom: 24}}>
						This album is protected. Enter your PIN to view its contents.
					</Text>
					<Button
						variant="default"
						onPress={() => setIsPinDialogOpen(true)}
						className="h-14 px-8"
					>
						<Text style={{color: darkTheme.foreground, fontSize: 16, fontWeight: '600'}}>
							Enter PIN
						</Text>
					</Button>
				</View>

				<PinVerificationDialog
					albumId={id}
					isOpen={isPinDialogOpen}
					onClose={() => setIsPinDialogOpen(false)}
					onVerified={handlePinVerified}
				/>

				<AlbumActionsSheet
					isOpen={isActionsSheetOpen}
					onClose={() => setIsActionsSheetOpen(false)}
					onEdit={() => setIsEditing(true)}
					onDelete={handleDeleteAlbum}
					isProtected={false}
					isDeleting={isDeleting}
				/>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={{bottom: 'off'}}>
			<PhotoGallery
				photos={photos || []}
				isLoading={photosLoading || albumLoading}
				error={photosError?.message || null}
				headerComponent={renderHeader()}
				onRefresh={refetchPhotos}
				isRefreshing={isRefetching}
			/>

			<PinVerificationDialog
				albumId={id}
				isOpen={isPinDialogOpen}
				onClose={() => setIsPinDialogOpen(false)}
				onVerified={handlePinVerified}
			/>

		<AlbumActionsSheet
			isOpen={isActionsSheetOpen}
			onClose={() => setIsActionsSheetOpen(false)}
			onEdit={() => setIsEditing(true)}
			onDelete={handleDeleteAlbum}
			onLock={album?.isProtected && !album.requiresPin ? handleLockAlbum : undefined}
			isProtected={album?.isProtected ?? false}
			isDeleting={isDeleting}
		/>
		</SafeAreaView>
	)
}

export default AlbumDetailScreen
