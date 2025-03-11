'use client'

import {useState, useEffect} from 'react'
import {useParams} from 'next/navigation'
import {useSharedItems} from '@/app/api/shared/query'
import {SharePinDialog} from '@/components/share-pin-dialog'
import {Gallery} from '@/components/gallery'
import {formatDistanceToNow} from 'date-fns'
import {LockIcon, ClockIcon, Album as AlbumIcon} from 'lucide-react'
import {Button} from '@halycron/ui/components/button'
import {Loader2} from 'lucide-react'
import {PhotoView} from '@/app/shared/[token]/photo-view'
import {GetSharedItemsResponse} from '@/app/api/shared/types'
import {Photo} from '@/app/api/photos/types'

// Define the extended Album type that includes photos
type AlbumWithPhotos = {
	id: string
	name: string
	isSensitive: boolean
	isProtected: boolean
	createdAt: Date
	updatedAt: Date
	photos?: Photo[]
}

const SharedPage = () => {
	const {token} = useParams<{ token: string }>()
	const [isPinVerified, setIsPinVerified] = useState(false)
	const [showPinDialog, setShowPinDialog] = useState(false)

	const {data, isLoading, isError, error} = useSharedItems(token, isPinVerified)

	useEffect(() => {
		// If the data is fetched and it requires PIN verification, show the PIN dialog
		if (data && data.isPinProtected && !isPinVerified) {
			setShowPinDialog(true)
		}
	}, [data, isPinVerified])

	if (isLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Loader2 className="mr-2 h-8 w-8 animate-spin" />
				<p>Loading shared content...</p>
			</div>
		)
	}

	if (isError) {
		return (
			<div className="flex h-screen w-full flex-col items-center justify-center gap-4">
				<h1 className="text-2xl font-bold">Error</h1>
				<p className="text-muted-foreground">{error?.message || 'Failed to load shared content'}</p>
			</div>
		)
	}

	if (!data) {
		return (
			<div className="flex h-screen w-full flex-col items-center justify-center gap-4">
				<h1 className="text-2xl font-bold">Invalid Link</h1>
				<p className="text-muted-foreground">This shared link is invalid or has expired.</p>
			</div>
		)
	}

	// Show PIN verification dialog if needed
	if (data.isPinProtected && !isPinVerified) {
		return (
			<>
				<div className="flex h-screen w-full flex-col items-center justify-center gap-4">
					<LockIcon className="h-12 w-12 text-muted-foreground" />
					<h1 className="text-2xl font-bold">PIN Protected Content</h1>
					<p className="text-muted-foreground">This content is protected with a PIN.</p>
					<Button onClick={() => setShowPinDialog(true)}>Enter PIN</Button>
				</div>

				<SharePinDialog
					open={showPinDialog}
					onOpenChange={setShowPinDialog}
					token={token}
					onPinVerified={() => setIsPinVerified(true)}
				/>
			</>
		)
	}

	// Display shared content
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex flex-col gap-2">
				<h1 className="text-2xl font-bold">Shared Content</h1>
				<div className="flex items-center gap-1 text-sm text-muted-foreground">
					<ClockIcon className="h-4 w-4" />
					<span>Expires {formatDistanceToNow(new Date(data.expiresAt))} from now</span>
				</div>
			</div>

			{data.shareType === 'photo' && data.photos && data.photos[0] && (
				<PhotoView photo={data.photos[0]} />
			)}

			{data.shareType === 'album' && data.albums && (
				<div className="space-y-8">
					{(data.albums as AlbumWithPhotos[]).map((album) => (
						<div key={album.id} className="space-y-4">
							<div className="flex items-center gap-2">
								<AlbumIcon className="h-5 w-5" />
								<h2 className="text-xl font-semibold">{album.name}</h2>
							</div>

							{album.photos && album.photos.length > 0 ? (
								<Gallery photos={album.photos} />
							) : (
								<p className="text-muted-foreground">This album is empty.</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default SharedPage

