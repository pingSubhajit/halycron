import {PhotoView} from '@/app/app/photo-view'
import {EmailVerificationBanner} from '@/components/email-verification-banner'
import {Metadata} from 'next'

export const metadata: Metadata = {
	title: 'Halycron Gallery – Your Secure, Private Photo Vault',
	description: 'Access your private and highly secure photo vault with Halycron. Organize, manage, and protect your photos with end-to-end encryption that only you have access to.',
	keywords: [
		'Halycron gallery',
		'secure photo storage',
		'private photo vault',
		'encrypted image storage',
		'cloud photo backup',
		'secure photo management'
	]
}

const ApplicationHome = () => {
	return (
		<>
			<EmailVerificationBanner/>
			<PhotoView/>
		</>
	)
}

export default ApplicationHome
