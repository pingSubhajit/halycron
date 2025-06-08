import {Metadata} from 'next'
import {SettingsLayout} from '@/components/settings/settings-layout'
import {SecuritySettings} from '@/components/settings/security-settings'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'

export const metadata: Metadata = {
	title: 'Security Settings – Halycron',
	description: 'Manage two-factor authentication, password, and security settings for your private photo vault.',
	keywords: [
		'Halycron security',
		'two-factor authentication',
		'password settings',
		'security preferences'
	]
}

const SecuritySettingsPage = async () => {
	// Get session on server side
	const session = await auth.api.getSession({
		headers: await headers()
	})

	// Redirect to login if no session (shouldn't happen due to middleware, but good to be safe)
	if (!session) {
		redirect('/login')
	}

	return (
		<SettingsLayout activeTab="security">
			<SecuritySettings/>
		</SettingsLayout>
	)
}

export default SecuritySettingsPage 