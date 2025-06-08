import {Metadata} from 'next'
import {SettingsLayout} from '@/components/settings/settings-layout'
import {StorageSettings} from '@/components/settings/storage-settings'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'

export const metadata: Metadata = {
	title: 'Storage Settings – Halycron',
	description: 'Manage your S3 bucket and storage preferences for your private photo vault.',
	keywords: [
		'Halycron storage',
		'S3 bucket settings',
		'storage preferences',
		'cloud storage'
	]
}

const StorageSettingsPage = async () => {
	// Get session on server side
	const session = await auth.api.getSession({
		headers: await headers()
	})

	// Redirect to login if no session (shouldn't happen due to middleware, but good to be safe)
	if (!session) {
		redirect('/login')
	}

	return (
		<SettingsLayout activeTab="storage">
			<StorageSettings/>
		</SettingsLayout>
	)
}

export default StorageSettingsPage 