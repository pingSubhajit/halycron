import {Metadata} from 'next'
import {LandingPage} from '@/app/(site)/landing-page'

export const metadata: Metadata = {
	title: 'Halycron – The Ultimate Private & Secure Photo Vault',
	description: 'Halycron is a highly secure, end-to-end encrypted photo storage solution. Store, organize, and manage your photos in your personal or private S3 bucket with zero-knowledge encryption. Keep your memories safe—only you can access them.',
	keywords: [
		'secure photo vault',
		'private photo storage',
		'encrypted photo storage',
		'self-hosted photo backup',
		'S3 photo storage',
		'end-to-end encrypted gallery',
		'secure cloud storage',
		'private photo album',
		'security-focused photo manager'
	]
}

const Page = () => (
	<>
		<LandingPage/>
	</>
)

export default Page
