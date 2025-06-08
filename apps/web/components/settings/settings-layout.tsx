'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {Card} from '@halycron/ui/components/card'
import {cn} from '@halycron/ui/lib/utils'
import {Download, Key, Shield, User} from 'lucide-react'

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
	href: string
}

const tabs: TabItem[] = [
	{
		id: 'profile',
		label: 'Profile',
		icon: User,
		description: 'Manage your personal information and account details',
		href: '/app/settings/profile'
	},
	{
		id: 'security',
		label: 'Security',
		icon: Shield,
		description: 'Two-factor authentication, password, and security settings',
		href: '/app/settings/security'
	},
	{
		id: 'storage',
		label: 'Storage',
		icon: Download,
		description: 'Manage your S3 bucket and storage preferences',
		href: '/app/settings/storage'
	},
	{
		id: 'privacy',
		label: 'Privacy',
		icon: Key,
		description: 'Control your privacy settings and data handling',
		href: '/app/settings/privacy'
	}
]

interface SettingsLayoutProps {
	activeTab: SettingsTab
	children: React.ReactNode
}

export const SettingsLayout = ({activeTab, children}: SettingsLayoutProps) => {
	const [mounted, setMounted] = useState(false)
	const router = useRouter()

	useEffect(() => {
		setMounted(true)
	}, [])

	const handleTabClick = (href: string) => {
		router.push(href)
	}

	return (
		<div className="w-full max-w-6xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
				<p className="text-muted-foreground mt-2">
					Manage your account settings and preferences
				</p>
			</div>

			{/* Horizontal Navigation Tabs */}
			<Card className="mb-6">
				<div className="p-2">
					<nav className="flex flex-wrap gap-2 items-center justify-between">
						{tabs.map((tab) => {
							const Icon = tab.icon
							return (
								<button
									key={tab.id}
									onClick={() => handleTabClick(tab.href)}
									className={cn(
										'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
										activeTab === tab.id
											? 'bg-accent text-primary-foreground'
											: 'hover:bg-accent text-muted-foreground hover:text-foreground'
									)}
								>
									{mounted ? <Icon className="h-4 w-4"/> : <div className="h-4 w-4"/>}
									<span>{tab.label}</span>
								</button>
							)
						})}
					</nav>
				</div>
			</Card>

			{/* Content Area */}
			<div>
				{children}
			</div>
		</div>
	)
}
