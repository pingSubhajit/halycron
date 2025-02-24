import {Metadata} from 'next'
import {AlbumView} from '@/app/app/albums/album-view'

export const metadata: Metadata = {
	title: 'Halycron Secure Albums – Organize & Protect Your Memories',
	description: 'Manage your private photo albums securely with Halycron. Organize photos into multiple albums, mark albums as sensitive to hide exclusive photos, and add a four-digit PIN for extra protection. Your data stays encrypted and private.',
	keywords: [
		'private photo albums',
		'secure albums',
		'encrypted albums',
		'hidden photos',
		'album PIN protection',
		'sensitive photos',
		'privacy-focused gallery',
		'photo vault',
		'end-to-end encrypted storage',
		'secure photo management'
	]
}

const AlbumPage = () => {
	return (
		<>
			<AlbumView />
		</>
	)
}

export default AlbumPage
