import {Metadata} from 'next'
import {SettingsLayout} from '@/components/settings/settings-layout'
import {ProfileSettings} from '@/components/settings/profile-settings'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'
import type {Session} from '@/types/auth'

export const metadata: Metadata = {
	title: 'Profile Settings – Halycron',
	description: 'Manage your personal information and account details for your private photo vault.',
	keywords: [
		'Halycron profile',
		'account profile',
		'personal information',
		'profile settings'
	]
}

const ProfileSettingsPage = async () => {
	// Get session on server side
	const session = await auth.api.getSession({
		headers: await headers()
	})

	// Redirect to login if no session (shouldn't happen due to middleware, but good to be safe)
	if (!session) {
		redirect('/login')
	}

	return (
		<SettingsLayout activeTab="profile">
			<ProfileSettings initialSession={session as unknown as Session}/>
		</SettingsLayout>
	)
}

export default ProfileSettingsPage 