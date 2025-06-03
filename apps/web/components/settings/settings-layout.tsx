'use client'

import {useEffect, useState} from 'react'
import {Card} from '@halycron/ui/components/card'
import {cn} from '@halycron/ui/lib/utils'
import {Bell, Download, Key, Mail, Settings, Shield, User} from 'lucide-react'
import {ProfileSettings} from '@/components/settings/profile-settings'
import {SecuritySettings} from '@/components/settings/security-settings'
import {EmailPreferences} from '@/components/settings/email-preferences'
import {StorageSettings} from '@/components/settings/storage-settings'
import {PrivacySettings} from '@/components/settings/privacy-settings'
import {NotificationSettings} from '@/components/settings/notification-settings'
import {AdvancedSettings} from '@/components/settings/advanced-settings'
import type {Session} from '@/types/auth'

type SettingsTab =
	| 'profile'
	| 'security'
	| 'email'
	| 'storage'
	| 'privacy'
	| 'notifications'
	| 'advanced'

interface TabItem {
	id: SettingsTab
	label: string
	icon: React.ComponentType<{ className?: string }>
	description: string
}

const tabs: TabItem[] = [
	{
		id: 'profile',
		label: 'Profile',
		icon: User,
		description: 'Manage your personal information and account details'
	},
	{
		id: 'security',
		label: 'Security',
		icon: Shield,
		description: 'Two-factor authentication, password, and security settings'
	},
	{
		id: 'storage',
		label: 'Storage',
		icon: Download,
		description: 'Manage your S3 bucket and storage preferences'
	},
	{
		id: 'privacy',
		label: 'Privacy',
		icon: Key,
		description: 'Control your privacy settings and data handling'
	},
	{
		id: 'notifications',
		label: 'Notifications',
		icon: Bell,
		description: 'Configure notification preferences'
	},
	{
		id: 'email',
		label: 'Email Preferences',
		icon: Mail,
		description: 'Control what emails you receive from us'
	},
	{
		id: 'advanced',
		label: 'Advanced',
		icon: Settings,
		description: 'Advanced settings and account management'
	}
]

interface SettingsLayoutProps {
	initialSession: Session
}

export const SettingsLayout = ({initialSession}: SettingsLayoutProps) => {
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const renderContent = () => {
		switch (activeTab) {
		case 'profile':
			return <ProfileSettings initialSession={initialSession}/>
		case 'security':
			return <SecuritySettings/>
		case 'email':
			return <EmailPreferences/>
		case 'storage':
			return <StorageSettings/>
		case 'privacy':
			return <PrivacySettings/>
		case 'notifications':
			return <NotificationSettings/>
		case 'advanced':
			return <AdvancedSettings/>
		default:
			return <ProfileSettings initialSession={initialSession}/>
		}
	}

	return (
		<div className="w-full max-w-7xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
				<p className="text-muted-foreground mt-2">
					Manage your account settings and preferences
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Sidebar Navigation */}
				<Card className="lg:col-span-1 h-fit">
					<div className="p-6">
						<nav className="space-y-2">
							{tabs.map((tab) => {
								const Icon = tab.icon
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={cn(
											'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
											activeTab === tab.id
												? 'bg-accent text-primary-foreground'
												: 'hover:bg-muted text-muted-foreground hover:text-foreground'
										)}
									>
										{mounted ? <Icon className="h-4 w-4"/> : <div className="h-4 w-4"/>}
										<div className="flex-1">
											<div className="font-medium">{tab.label}</div>
										</div>
									</button>
								)
							})}
						</nav>
					</div>
				</Card>

				{/* Content Area */}
				<div className="lg:col-span-3">
					{renderContent()}
				</div>
			</div>
		</div>
	)
}
