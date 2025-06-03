'use client'

import {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Switch} from '@halycron/ui/components/switch'
import {Separator} from '@halycron/ui/components/separator'
import {Badge} from '@halycron/ui/components/badge'
import {Bell, CheckCircle, Info, Mail, Shield, Zap} from 'lucide-react'

interface EmailPreference {
	id: string
	title: string
	description: string
	category: 'security' | 'product' | 'marketing'
	enabled: boolean
	required: boolean
}

export const EmailPreferences = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [preferences, setPreferences] = useState<EmailPreference[]>([
		// Security & Account (Required)
		{
			id: 'security-alerts',
			title: 'Security Alerts',
			description: 'Important security notifications, login alerts, and suspicious activity warnings',
			category: 'security',
			enabled: true,
			required: true
		},
		{
			id: 'account-changes',
			title: 'Account Changes',
			description: 'Notifications when your account settings, password, or 2FA status changes',
			category: 'security',
			enabled: true,
			required: true
		},
		{
			id: 'backup-reminders',
			title: 'Backup Reminders',
			description: 'Periodic reminders to backup your encryption keys and download your data',
			category: 'security',
			enabled: true,
			required: false
		},

		// Product Updates
		{
			id: 'feature-updates',
			title: 'Feature Updates',
			description: 'Announcements about new features and improvements to Halycron',
			category: 'product',
			enabled: true,
			required: false
		},
		{
			id: 'maintenance-alerts',
			title: 'Maintenance Alerts',
			description: 'Notifications about scheduled maintenance and service updates',
			category: 'product',
			enabled: true,
			required: false
		},
		{
			id: 'storage-notifications',
			title: 'Storage Notifications',
			description: 'Alerts when you\'re approaching storage limits or have storage issues',
			category: 'product',
			enabled: true,
			required: false
		},

		// Marketing & Tips
		{
			id: 'tips-tutorials',
			title: 'Tips & Tutorials',
			description: 'Helpful tips to get the most out of your secure photo vault',
			category: 'marketing',
			enabled: false,
			required: false
		},
		{
			id: 'newsletter',
			title: 'Newsletter',
			description: 'Monthly updates about privacy, security trends, and Halycron news',
			category: 'marketing',
			enabled: false,
			required: false
		}
	])

	const handleTogglePreference = async (id: string) => {
		setIsLoading(true)
		try {
			setPreferences(prev => prev.map(pref => pref.id === id ? {...pref, enabled: !pref.enabled} : pref))
			// TODO: Implement API call to save preference
			console.log('Toggle preference:', id)
			await new Promise(resolve => setTimeout(resolve, 500))
		} catch (error) {
			console.error('Failed to update preference:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleSaveAll = async () => {
		setIsLoading(true)
		try {
			// TODO: Implement API call to save all preferences
			console.log('Save all preferences:', preferences)
			await new Promise(resolve => setTimeout(resolve, 1000))
		} catch (error) {
			console.error('Failed to save preferences:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const getCategoryIcon = (category: string) => {
		switch (category) {
		case 'security':
			return <Shield className="h-4 w-4"/>
		case 'product':
			return <Zap className="h-4 w-4"/>
		case 'marketing':
			return <Mail className="h-4 w-4"/>
		default:
			return <Bell className="h-4 w-4"/>
		}
	}

	const getCategoryColor = (category: string) => {
		switch (category) {
		case 'security':
			return 'bg-red-500/10 text-red-500 border-red-500/20'
		case 'product':
			return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
		case 'marketing':
			return 'bg-green-500/10 text-green-500 border-green-500/20'
		default:
			return 'bg-muted'
		}
	}

	const securityPrefs = preferences.filter(p => p.category === 'security')
	const productPrefs = preferences.filter(p => p.category === 'product')
	const marketingPrefs = preferences.filter(p => p.category === 'marketing')

	return (
		<div className="space-y-6">
			{/* Email Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5"/>
						Email Preferences
					</CardTitle>
					<CardDescription>
						Control what emails you receive from Halycron
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-red-500/10 rounded-lg">
								<Shield className="h-5 w-5 text-red-500"/>
							</div>
							<div>
								<div className="font-medium">Security</div>
								<div className="text-sm text-muted-foreground">
									{securityPrefs.filter(p => p.enabled).length} of {securityPrefs.length} enabled
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-blue-500/10 rounded-lg">
								<Zap className="h-5 w-5 text-blue-500"/>
							</div>
							<div>
								<div className="font-medium">Product</div>
								<div className="text-sm text-muted-foreground">
									{productPrefs.filter(p => p.enabled).length} of {productPrefs.length} enabled
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-green-500/10 rounded-lg">
								<Mail className="h-5 w-5 text-green-500"/>
							</div>
							<div>
								<div className="font-medium">Marketing</div>
								<div className="text-sm text-muted-foreground">
									{marketingPrefs.filter(p => p.enabled).length} of {marketingPrefs.length} enabled
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Security Emails */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-red-500"/>
						Security & Account
					</CardTitle>
					<CardDescription>
						Critical security and account-related notifications
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{securityPrefs.map((pref) => (
						<div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">{pref.title}</span>
									{pref.required && (
										<Badge variant="outline"
											className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
											Required
										</Badge>
									)}
								</div>
								<p className="text-sm text-muted-foreground">{pref.description}</p>
							</div>
							<Switch
								checked={pref.enabled}
								onCheckedChange={() => !pref.required && handleTogglePreference(pref.id)}
								disabled={pref.required || isLoading}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Product Updates */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="h-5 w-5 text-blue-500"/>
						Product Updates
					</CardTitle>
					<CardDescription>
						Updates about features, maintenance, and your storage
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{productPrefs.map((pref) => (
						<div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">{pref.title}</span>
								</div>
								<p className="text-sm text-muted-foreground">{pref.description}</p>
							</div>
							<Switch
								checked={pref.enabled}
								onCheckedChange={() => handleTogglePreference(pref.id)}
								disabled={isLoading}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Marketing */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5 text-green-500"/>
						Tips & Newsletter
					</CardTitle>
					<CardDescription>
						Optional helpful content and updates
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{marketingPrefs.map((pref) => (
						<div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">{pref.title}</span>
								</div>
								<p className="text-sm text-muted-foreground">{pref.description}</p>
							</div>
							<Switch
								checked={pref.enabled}
								onCheckedChange={() => handleTogglePreference(pref.id)}
								disabled={isLoading}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Email Frequency */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Info className="h-5 w-5"/>
						Email Information
					</CardTitle>
					<CardDescription>
						How we handle your email preferences
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="p-4 bg-muted/30 rounded-lg">
							<h4 className="font-medium mb-2">Our Email Policy</h4>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>• Security emails cannot be disabled as they protect your account</li>
								<li>• We send product updates sparingly, only for important changes</li>
								<li>• Marketing emails are optional and can be unsubscribed at any time</li>
								<li>• We never share your email with third parties</li>
								<li>• You can unsubscribe from non-security emails using links in any email</li>
							</ul>
						</div>

						<Separator/>

						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								Changes are saved automatically
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CheckCircle className="h-4 w-4 text-green-500"/>
								Preferences saved
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
