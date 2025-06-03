import {Metadata} from 'next'
import {SettingsLayout} from '@/components/settings/settings-layout'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'
import type {Session} from '@/types/auth'

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
	// Get session on server side
	const session = await auth.api.getSession({
		headers: await headers()
	})

	// Redirect to login if no session (shouldn't happen due to middleware, but good to be safe)
	if (!session) {
		redirect('/login')
	}

	return <SettingsLayout initialSession={session as unknown as Session}/>
}

export default SettingsPage
