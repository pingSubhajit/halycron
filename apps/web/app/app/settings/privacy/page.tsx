import {Metadata} from 'next'
import {SettingsLayout} from '@/components/settings/settings-layout'
import {PrivacySettings} from '@/components/settings/privacy-settings'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'

export const metadata: Metadata = {
	title: 'Privacy Settings – Halycron',
	description: 'Control your privacy settings and data handling for your private photo vault.',
	keywords: [
		'Halycron privacy',
		'privacy settings',
		'data handling',
		'privacy preferences'
	]
}

const PrivacySettingsPage = async () => {
	// Get session on server side
	const session = await auth.api.getSession({
		headers: await headers()
	})

	// Redirect to login if no session (shouldn't happen due to middleware, but good to be safe)
	if (!session) {
		redirect('/login')
	}

	return (
		<SettingsLayout activeTab="privacy">
			<PrivacySettings/>
		</SettingsLayout>
	)
}

export default PrivacySettingsPage 