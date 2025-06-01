import React, {useEffect, useState} from 'react'
import {ActivityIndicator, Text, View} from 'react-native'
import {router, useLocalSearchParams} from 'expo-router'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Photo as SharedPhoto, useSharedItems} from '@/src/lib/shared-api'
import {darkTheme} from '@/src/theme/theme'
import {Lock} from '@/lib/icons/Lock'
import {Clock} from '@/lib/icons/Clock'
import {Album as AlbumIcon} from '@/lib/icons/Album'
import {Button} from '@/src/components/ui/button'
import {SharedPhotoView} from '@/src/components/shared-photo-view'
import {SharedPinDialog} from '@/src/components/shared-pin-dialog'
import {formatDistanceToNow} from 'date-fns'

type AlbumWithPhotos = {
	id: string
	name: string
	isSensitive: boolean
	isProtected: boolean
	createdAt: Date
	updatedAt: Date
	photos?: SharedPhoto[]
}

const SharedPage = () => {
	const {token} = useLocalSearchParams<{ token: string }>()
	const [isPinVerified, setIsPinVerified] = useState(false)
	const [showPinDialog, setShowPinDialog] = useState(false)

	const {data, isLoading, isError, error} = useSharedItems(token || '', isPinVerified)

	useEffect(() => {
		// If the data is fetched and it requires PIN verification, show the PIN dialog
		if (data && data.isPinProtected && !isPinVerified) {
			setShowPinDialog(true)
		}
	}, [data, isPinVerified])

	if (isLoading) {
		return (
			<SafeAreaView style={{
				flex: 1,
				backgroundColor: darkTheme.dark,
				justifyContent: 'center',
				alignItems: 'center'
			}}>
				<ActivityIndicator size="large" color={darkTheme.primary}/>
				<Text style={{
					color: darkTheme.foreground,
					fontSize: 16,
					marginTop: 16
				}}>
					Loading shared content...
				</Text>
			</SafeAreaView>
		)
	}

	if (isError) {
		return (
			<SafeAreaView style={{
				flex: 1,
				backgroundColor: darkTheme.dark,
				justifyContent: 'center',
				alignItems: 'center',
				paddingHorizontal: 20
			}}>
				<Text style={{
					color: darkTheme.foreground,
					fontSize: 24,
					fontWeight: 'bold',
					marginBottom: 8
				}}>
					Error
				</Text>
				<Text style={{
					color: darkTheme.mutedForeground,
					fontSize: 16,
					textAlign: 'center'
				}}>
					{error?.message || 'Failed to load shared content'}
				</Text>
				<Button
					onPress={() => router.back()}
					variant="ghost"
					className="mt-4"
				>
					<Text style={{color: 'white'}}>Go Back</Text>
				</Button>
			</SafeAreaView>
		)
	}

	if (!data) {
		return (
			<SafeAreaView style={{
				flex: 1,
				backgroundColor: darkTheme.dark,
				justifyContent: 'center',
				alignItems: 'center',
				paddingHorizontal: 20
			}}>
				<Text style={{
					color: darkTheme.foreground,
					fontSize: 24,
					fontWeight: 'bold',
					marginBottom: 8
				}}>
					Invalid Link
				</Text>
				<Text style={{
					color: darkTheme.mutedForeground,
					fontSize: 16,
					textAlign: 'center'
				}}>
					This shared link is invalid or has expired.
				</Text>
				<Button
					onPress={() => router.back()}
					variant="ghost"
					className="mt-4"
				>
					<Text style={{color: 'white'}}>Go Back</Text>
				</Button>
			</SafeAreaView>
		)
	}

	// Show PIN verification dialog if needed
	if (data.isPinProtected && !isPinVerified) {
		return (
			<>
				<SafeAreaView style={{
					flex: 1,
					backgroundColor: darkTheme.dark,
					justifyContent: 'center',
					alignItems: 'center',
					paddingHorizontal: 20
				}}>
					<Lock size={48} color={darkTheme.mutedForeground}/>
					<Text style={{
						color: darkTheme.foreground,
						fontSize: 24,
						fontWeight: 'bold',
						marginTop: 16,
						marginBottom: 8
					}}>
						PIN Protected Content
					</Text>
					<Text style={{
						color: darkTheme.mutedForeground,
						fontSize: 16,
						textAlign: 'center',
						marginBottom: 24
					}}>
						This content is protected with a PIN.
					</Text>
					<Button
						onPress={() => setShowPinDialog(true)}
						variant="ghost"
					>
						<Text style={{color: 'white'}}>Enter PIN</Text>
					</Button>
				</SafeAreaView>

				<SharedPinDialog
					isOpen={showPinDialog}
					onClose={() => setShowPinDialog(false)}
					token={token || ''}
					onPinVerified={() => setIsPinVerified(true)}
				/>
			</>
		)
	}

	// Display shared content
	return (
		<SafeAreaView style={{
			flex: 1,
			backgroundColor: darkTheme.dark
		}}>
			<View style={{
				padding: 16,
				borderBottomWidth: 1,
				borderBottomColor: '#333'
			}}>
				<Text style={{
					color: darkTheme.foreground,
					fontSize: 24,
					fontWeight: 'bold',
					marginBottom: 8
				}}>
					Shared Content
				</Text>
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: 8
				}}>
					<Clock size={16} color={darkTheme.mutedForeground}/>
					<Text style={{
						color: darkTheme.mutedForeground,
						fontSize: 14
					}}>
						Expires {formatDistanceToNow(new Date(data.expiresAt))} from now
					</Text>
				</View>
			</View>

			{data.shareType === 'photo' && data.photos && data.photos[0] && (
				<SharedPhotoView photo={data.photos[0]}/>
			)}

			{data.shareType === 'album' && data.albums && (
				<View style={{flex: 1, padding: 16}}>
					{(data.albums as AlbumWithPhotos[]).map((album) => (
						<View key={album.id} style={{marginBottom: 24}}>
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: 8,
								marginBottom: 16
							}}>
								<AlbumIcon size={20} color={darkTheme.foreground}/>
								<Text style={{
									color: darkTheme.foreground,
									fontSize: 18,
									fontWeight: '600'
								}}>
									{album.name}
								</Text>
							</View>

							{album.photos && album.photos.length > 0 ? (
								// For now, show the first photo. Later we can implement a gallery view
								<SharedPhotoView photo={album.photos[0]}/>
							) : (
								<Text style={{
									color: darkTheme.mutedForeground,
									fontSize: 14
								}}>
									This album is empty.
								</Text>
							)}
						</View>
					))}
				</View>
			)}
		</SafeAreaView>
	)
}

export default SharedPage
