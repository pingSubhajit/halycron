'use client'

import {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Switch} from '@halycron/ui/components/switch'
import {Separator} from '@halycron/ui/components/separator'
import {Badge} from '@halycron/ui/components/badge'
import {AlertCircle, CheckCircle, Download, Eye, FileText, Key, Lock, Shield} from 'lucide-react'

interface PrivacySetting {
	id: string
	title: string
	description: string
	enabled: boolean
	category: 'encryption' | 'metadata' | 'sharing' | 'tracking'
	required?: boolean
}

export const PrivacySettings = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [settings, setSettings] = useState<PrivacySetting[]>([
		// Encryption Settings
		{
			id: 'client-side-encryption',
			title: 'Client-Side Encryption',
			description: 'All photos are encrypted on your device before upload',
			category: 'encryption',
			enabled: true,
			required: true
		},
		{
			id: 'metadata-encryption',
			title: 'Metadata Encryption',
			description: 'Photo metadata (EXIF, location, timestamps) is encrypted',
			category: 'metadata',
			enabled: true,
			required: true
		},
		{
			id: 'filename-encryption',
			title: 'Filename Encryption',
			description: 'Original filenames are encrypted and replaced with random identifiers',
			category: 'metadata',
			enabled: true,
			required: true
		},

		// Metadata Privacy
		{
			id: 'strip-location',
			title: 'Strip Location Data',
			description: 'Remove GPS location information from photos before encryption',
			category: 'metadata',
			enabled: false
		},
		{
			id: 'anonymize-timestamps',
			title: 'Anonymize Timestamps',
			description: 'Blur exact timestamps to protect activity patterns',
			category: 'metadata',
			enabled: false
		},

		// Sharing & Access
		{
			id: 'zero-knowledge',
			title: 'Zero-Knowledge Architecture',
			description: 'Halycron cannot access your photos or encryption keys',
			category: 'encryption',
			enabled: true,
			required: true
		},
		{
			id: 'shared-link-expiry',
			title: 'Auto-Expire Shared Links',
			description: 'Shared photo links automatically expire after 7 days',
			category: 'sharing',
			enabled: true
		},
		{
			id: 'require-2fa-sharing',
			title: 'Require 2FA for Sharing',
			description: 'Require two-factor authentication to create shared links',
			category: 'sharing',
			enabled: false
		},

		// Analytics & Tracking
		{
			id: 'disable-analytics',
			title: 'Disable Usage Analytics',
			description: 'Opt out of anonymous usage analytics and error reporting',
			category: 'tracking',
			enabled: false
		},
		{
			id: 'minimal-logs',
			title: 'Minimal Server Logs',
			description: 'Keep only essential server logs and auto-delete after 30 days',
			category: 'tracking',
			enabled: true
		}
	])

	const handleToggleSetting = async (id: string) => {
		const setting = settings.find(s => s.id === id)
		if (setting?.required) return

		setIsLoading(true)
		try {
			setSettings(prev => prev.map(setting => setting.id === id ? {
				...setting,
				enabled: !setting.enabled
			} : setting))
			// TODO: Implement API call to save setting
			console.log('Toggle privacy setting:', id)
			await new Promise(resolve => setTimeout(resolve, 500))
		} catch (error) {
			console.error('Failed to update privacy setting:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const encryptionSettings = settings.filter(s => s.category === 'encryption')
	const metadataSettings = settings.filter(s => s.category === 'metadata')
	const sharingSettings = settings.filter(s => s.category === 'sharing')
	const trackingSettings = settings.filter(s => s.category === 'tracking')

	return (
		<div className="space-y-6">
			{/* Privacy Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Key className="h-5 w-5"/>
						Privacy Overview
					</CardTitle>
					<CardDescription>
						Your privacy and security status at a glance
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-green-500/10 rounded-lg">
								<Lock className="h-5 w-5 text-green-500"/>
							</div>
							<div>
								<div className="font-medium">Encryption</div>
								<div className="text-sm text-muted-foreground">
									{encryptionSettings.filter(s => s.enabled).length}/{encryptionSettings.length} active
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-blue-500/10 rounded-lg">
								<FileText className="h-5 w-5 text-blue-500"/>
							</div>
							<div>
								<div className="font-medium">Metadata</div>
								<div className="text-sm text-muted-foreground">
									{metadataSettings.filter(s => s.enabled).length}/{metadataSettings.length} protected
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-purple-500/10 rounded-lg">
								<Eye className="h-5 w-5 text-purple-500"/>
							</div>
							<div>
								<div className="font-medium">Sharing</div>
								<div className="text-sm text-muted-foreground">
									{sharingSettings.filter(s => s.enabled).length}/{sharingSettings.length} secure
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-orange-500/10 rounded-lg">
								<Shield className="h-5 w-5 text-orange-500"/>
							</div>
							<div>
								<div className="font-medium">Tracking</div>
								<div className="text-sm text-muted-foreground">
									{trackingSettings.filter(s => s.enabled).length}/{trackingSettings.length} minimal
								</div>
							</div>
						</div>
					</div>

					<div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
						<div className="flex items-center gap-2 text-green-600">
							<CheckCircle className="h-4 w-4"/>
							<span className="font-medium">Zero-Knowledge Privacy Active</span>
						</div>
						<p className="text-sm text-muted-foreground mt-1">
							Your photos are encrypted on your device and we cannot access them, even if we wanted to.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Encryption Settings */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Lock className="h-5 w-5 text-green-500"/>
						Encryption & Security
					</CardTitle>
					<CardDescription>
						Core encryption and security features
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{encryptionSettings.map((setting) => (
						<div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">{setting.title}</span>
									{setting.required && (
										<Badge variant="outline"
											className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
											Required
										</Badge>
									)}
								</div>
								<p className="text-sm text-muted-foreground">{setting.description}</p>
							</div>
							<Switch
								checked={setting.enabled}
								onCheckedChange={() => !setting.required && handleToggleSetting(setting.id)}
								disabled={setting.required || isLoading}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Metadata Privacy */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-blue-500"/>
						Metadata Privacy
					</CardTitle>
					<CardDescription>
						Control how your photo metadata is handled
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{metadataSettings.map((setting) => (
						<div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">{setting.title}</span>
									{setting.required && (
										<Badge variant="outline"
											className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
											Required
										</Badge>
									)}
								</div>
								<p className="text-sm text-muted-foreground">{setting.description}</p>
							</div>
							<Switch
								checked={setting.enabled}
								onCheckedChange={() => !setting.required && handleToggleSetting(setting.id)}
								disabled={setting.required || isLoading}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Sharing & Access */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Eye className="h-5 w-5 text-purple-500"/>
						Sharing & Access
					</CardTitle>
					<CardDescription>
						Control how photos can be shared and accessed
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{sharingSettings.map((setting) => (
						<div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">{setting.title}</span>
									{setting.required && (
										<Badge variant="outline"
											className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
											Required
										</Badge>
									)}
								</div>
								<p className="text-sm text-muted-foreground">{setting.description}</p>
							</div>
							<Switch
								checked={setting.enabled}
								onCheckedChange={() => handleToggleSetting(setting.id)}
								disabled={isLoading}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Analytics & Tracking */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-orange-500"/>
						Analytics & Tracking
					</CardTitle>
					<CardDescription>
						Control data collection and analytics
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{trackingSettings.map((setting) => (
						<div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">{setting.title}</span>
								</div>
								<p className="text-sm text-muted-foreground">{setting.description}</p>
							</div>
							<Switch
								checked={setting.enabled}
								onCheckedChange={() => handleToggleSetting(setting.id)}
								disabled={isLoading}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Privacy Information */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5"/>
						Privacy Information
					</CardTitle>
					<CardDescription>
						How we protect your privacy and data
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="p-4 bg-muted/30 rounded-lg">
							<h4 className="font-medium mb-2">Our Privacy Principles</h4>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>• Zero-knowledge architecture - we cannot see your photos</li>
								<li>• End-to-end encryption with client-side key generation</li>
								<li>• No data mining or content analysis</li>
								<li>• Minimal data collection with explicit consent</li>
								<li>• Open source encryption implementation</li>
								<li>• Regular security audits and transparency reports</li>
							</ul>
						</div>

						<Separator/>

						<div className="flex items-center justify-between">
							<div>
								<div className="font-medium">Privacy Policy & Terms</div>
								<div className="text-sm text-muted-foreground">
									Review our privacy policy and terms of service
								</div>
							</div>
							<Button variant="outline">
								<Download className="h-4 w-4 mr-2"/>
								View Documents
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
