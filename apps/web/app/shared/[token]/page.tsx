'use client'

import {useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import {useSharedItems} from '@/app/api/shared/query'
import {SharePinDialog} from '@/components/share/share-pin-dialog'
import {formatDistanceToNow} from 'date-fns'
import {Album as AlbumIcon, ClockIcon, Loader2, LockIcon} from 'lucide-react'
import {Button} from '@halycron/ui/components/button'
import {PhotoView} from '@/app/shared/[token]/photo-view'
import {SharedPhoto} from '@/app/api/shared/types'
import {useQueryClient} from '@tanstack/react-query'
import {sharedQueryKeys} from '@/app/api/shared/keys'
import {SharedGallery} from '@/components/shared-gallery'
import {aeadDecrypt, b64UrlDecode, deriveKekPw, type KdfParams} from '@/lib/crypto/e2ee'

// Define the extended Album type that includes photos
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
	const {token} = useParams<{ token: string }>()
	const [showPinDialog, setShowPinDialog] = useState(false)
	const [pinForDecryption, setPinForDecryption] = useState<string | null>(null)
	const [shareKey, setShareKey] = useState<Uint8Array | null>(null)
	const [missingNonPinKey, setMissingNonPinKey] = useState(false)
	const [hasAutoPromptedPin, setHasAutoPromptedPin] = useState(false)
	const queryClient = useQueryClient()

	const {data, isLoading, isError, error} = useSharedItems(token)

	useEffect(() => {
		let mounted = true
		const compute = async () => {
			if (!data) return
			// PIN shares: share key comes from server (wrapped under PIN-derived key)
			if (data.isPinProtected) {
				setMissingNonPinKey(false)
				const pk = (data as any).pinKeyMaterial as (null | {skWrappedByPin: string; pinKdfSalt: string; pinKdfParams: string; skWrapIv: string})
				if (!pk || !pinForDecryption) return
				const params = JSON.parse(pk.pinKdfParams) as KdfParams
				const pinKey = await deriveKekPw(pinForDecryption, pk.pinKdfSalt, params)
				const sk = await aeadDecrypt({ciphertextB64: pk.skWrappedByPin, nonceB64: pk.skWrapIv}, pinKey)
				if (mounted) setShareKey(sk)
				return
			}

			// Non-PIN shares: share key is in URL fragment (#k=...)
			const hash = typeof window !== 'undefined' ? window.location.hash : ''
			const qs = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
			const k = qs.get('k')
			if (!k) {
				if (mounted) {
					setShareKey(null)
					setMissingNonPinKey(true)
				}
				return
			}
			const sk = await b64UrlDecode(k)
			if (mounted) {
				setMissingNonPinKey(false)
				setShareKey(sk)
			}
		}
		compute().catch(() => {
			if (mounted) setShareKey(null)
		})
		return () => {
			mounted = false
		}
	}, [data, pinForDecryption])

	useEffect(() => {
		// PIN shares need a PIN to decrypt the Share Key (SK), even if server access cookie exists.
		if (data && data.isPinProtected && !shareKey && !hasAutoPromptedPin) {
			setShowPinDialog(true)
			setHasAutoPromptedPin(true)
		}
	}, [data, shareKey, hasAutoPromptedPin])

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

	// PIN-protected share: always prompt for PIN if we don’t yet have the Share Key (SK) to decrypt.
	if (data.isPinProtected && !shareKey) {
		return (
			<>
				<div className="flex h-screen w-full flex-col items-center justify-center gap-4">
					<LockIcon className="h-12 w-12 text-muted-foreground" />
					<h1 className="text-2xl font-bold">PIN Protected Content</h1>
					<p className="text-muted-foreground">Enter the PIN to decrypt this content.</p>
					<Button onClick={() => setShowPinDialog(true)}>Enter PIN</Button>
				</div>

				<SharePinDialog
					open={showPinDialog}
					onOpenChange={setShowPinDialog}
					token={token}
					onPinVerified={(pin) => {
						setPinForDecryption(pin)
						// Server sets an access cookie; refetch shared items.
						queryClient.invalidateQueries({queryKey: sharedQueryKeys.detail(token)})
					}}
				/>
			</>
		)
	}

	// Non-PIN share but missing URL fragment key.
	if (!data.isPinProtected && missingNonPinKey) {
		return (
			<div className="flex h-screen w-full flex-col items-center justify-center gap-2 px-4">
				<h1 className="text-2xl font-bold">Missing decryption key</h1>
				<p className="text-muted-foreground text-center">
					This link is missing its decryption key fragment. Ask the sender to re-copy the full link (including the part after <span className="font-mono">#k=</span>).
				</p>
			</div>
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
				<PhotoView photo={data.photos[0]} shareKey={shareKey} />
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
								<SharedGallery photos={album.photos} shareKey={shareKey}/>
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

