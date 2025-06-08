import {Metadata} from 'next'
import {redirect} from 'next/navigation'

export const metadata: Metadata = {
	title: 'Settings – Halycron',
	description: 'Manage your account settings, security preferences, and email notifications for your private photo vault.',
	keywords: [
		'Halycron settings',
		'account settings',
		'security preferences',
		'photo vault settings',
		'privacy settings'
	]
}

const SettingsPage = async () => {
	// Redirect to profile settings by default
	redirect('/app/settings/profile')
}

export default SettingsPage
