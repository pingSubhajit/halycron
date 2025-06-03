'use client'

import {useState} from 'react'
import {AlertTriangle, Clock, Code, Database, Download, Globe, Key, Settings, Trash2, Upload} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Switch} from '@halycron/ui/components/switch'
import {Badge} from '@halycron/ui/components/badge'
import {Alert, AlertDescription} from '@halycron/ui/components/alert'
import {Separator} from '@halycron/ui/components/separator'
import {Input} from '@halycron/ui/components/input'
import {Label} from '@halycron/ui/components/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@halycron/ui/components/select'

export const AdvancedSettings = () => {
	const [isExporting, setIsExporting] = useState(false)
	const [showDangerZone, setShowDangerZone] = useState(false)
	const [deleteConfirmation, setDeleteConfirmation] = useState('')

	// Mock settings state
	const [settings, setSettings] = useState({
		developerMode: false,
		debugLogging: false,
		betaFeatures: false,
		apiAccess: false,
		webhookUrl: '',
		sessionTimeout: '24',
		language: 'en',
		timezone: 'UTC',
		theme: 'system'
	})

	const handleExportData = async () => {
		setIsExporting(true)
		// TODO: Implement actual data export
		setTimeout(() => {
			setIsExporting(false)
			// Simulate download
			const blob = new Blob([JSON.stringify({message: 'Your data export would be here'}, null, 2)], {
				type: 'application/json'
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'halycron-data-export.json'
			a.click()
			URL.revokeObjectURL(url)
		}, 2000)
	}

	const handleDeleteAccount = () => {
		if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
			alert('Please type \'DELETE MY ACCOUNT\' to confirm')
			return
		}

		// TODO: Implement actual account deletion
		alert('Account deletion would be processed here')
	}

	const updateSetting = (key: string, value: any) => {
		setSettings(prev => ({...prev, [key]: value}))
	}

	return (
		<div className="space-y-6">
			{/* Overview */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Settings className="h-5 w-5"/>
						<CardTitle>Advanced Settings</CardTitle>
					</div>
					<CardDescription>
						Advanced configuration options and account management tools
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertTriangle className="h-4 w-4"/>
						<AlertDescription>
							These settings are for advanced users. Changing these options may affect your account's
							functionality.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>

			{/* Data Management */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5"/>
						Data Management
					</CardTitle>
					<CardDescription>
						Export, import, and manage your account data
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border">
						<div className="flex items-center gap-3">
							<Download className="h-5 w-5 text-muted-foreground"/>
							<div>
								<div className="font-medium">Export Account Data</div>
								<div className="text-sm text-muted-foreground">
									Download all your photos, albums, and account information
								</div>
							</div>
						</div>
						<Button
							onClick={handleExportData}
							disabled={isExporting}
							variant="outline"
						>
							{isExporting ? 'Exporting...' : 'Export Data'}
						</Button>
					</div>

					<div className="flex items-center justify-between p-4 border">
						<div className="flex items-center gap-3">
							<Upload className="h-5 w-5 text-muted-foreground"/>
							<div>
								<div className="font-medium">Import Data</div>
								<div className="text-sm text-muted-foreground">
									Import photos and albums from other services
								</div>
							</div>
						</div>
						<Button variant="outline" disabled>
							Coming Soon
						</Button>
					</div>

					<Separator/>

					<div className="space-y-3">
						<Label htmlFor="webhook-url">Webhook URL</Label>
						<Input
							id="webhook-url"
							placeholder="https://your-app.com/webhook"
							value={settings.webhookUrl}
							onChange={(e) => updateSetting('webhookUrl', e.target.value)}
						/>
						<p className="text-sm text-muted-foreground">
							Receive real-time notifications about account events
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Developer Settings */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Code className="h-5 w-5"/>
						Developer Settings
					</CardTitle>
					<CardDescription>
						Settings for developers and power users
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">Developer Mode</div>
							<div className="text-sm text-muted-foreground">
								Enable advanced debugging and development features
							</div>
						</div>
						<Switch
							checked={settings.developerMode}
							onCheckedChange={(checked) => updateSetting('developerMode', checked)}
						/>
					</div>

					<Separator/>

					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">Debug Logging</div>
							<div className="text-sm text-muted-foreground">
								Enable detailed logging for troubleshooting
							</div>
						</div>
						<Switch
							checked={settings.debugLogging}
							onCheckedChange={(checked) => updateSetting('debugLogging', checked)}
						/>
					</div>

					<Separator/>

					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">Beta Features</div>
							<div className="text-sm text-muted-foreground">
								Access experimental features before they're released
							</div>
						</div>
						<Switch
							checked={settings.betaFeatures}
							onCheckedChange={(checked) => updateSetting('betaFeatures', checked)}
						/>
					</div>

					<Separator/>

					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">API Access</div>
							<div className="text-sm text-muted-foreground">
								Enable programmatic access to your account
							</div>
						</div>
						<div className="flex items-center gap-2">
							{settings.apiAccess && <Badge variant="secondary">Enabled</Badge>}
							<Switch
								checked={settings.apiAccess}
								onCheckedChange={(checked) => updateSetting('apiAccess', checked)}
							/>
						</div>
					</div>

					{settings.apiAccess && (
						<Alert>
							<Key className="h-4 w-4"/>
							<AlertDescription>
								API keys can be generated in the developer console. Keep them secure and never share
								them publicly.
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* System Preferences */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Globe className="h-5 w-5"/>
						System Preferences
					</CardTitle>
					<CardDescription>
						Customize your system and interface preferences
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="language">Language</Label>
							<Select value={settings.language}
								onValueChange={(value) => updateSetting('language', value)}>
								<SelectTrigger>
									<SelectValue/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">English</SelectItem>
									<SelectItem value="es">Español</SelectItem>
									<SelectItem value="fr">Français</SelectItem>
									<SelectItem value="de">Deutsch</SelectItem>
									<SelectItem value="ja">日本語</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="timezone">Timezone</Label>
							<Select value={settings.timezone}
								onValueChange={(value) => updateSetting('timezone', value)}>
								<SelectTrigger>
									<SelectValue/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="UTC">UTC</SelectItem>
									<SelectItem value="America/New_York">Eastern Time</SelectItem>
									<SelectItem value="America/Chicago">Central Time</SelectItem>
									<SelectItem value="America/Denver">Mountain Time</SelectItem>
									<SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
									<SelectItem value="Europe/London">London</SelectItem>
									<SelectItem value="Europe/Paris">Paris</SelectItem>
									<SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="session-timeout">Session Timeout (hours)</Label>
						<Select value={settings.sessionTimeout}
							onValueChange={(value) => updateSetting('sessionTimeout', value)}>
							<SelectTrigger>
								<SelectValue/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">1 hour</SelectItem>
								<SelectItem value="4">4 hours</SelectItem>
								<SelectItem value="8">8 hours</SelectItem>
								<SelectItem value="24">24 hours</SelectItem>
								<SelectItem value="168">1 week</SelectItem>
								<SelectItem value="720">30 days</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-sm text-muted-foreground">
							How long you stay logged in without activity
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="theme">Theme Preference</Label>
						<Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
							<SelectTrigger>
								<SelectValue/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">Light</SelectItem>
								<SelectItem value="dark">Dark</SelectItem>
								<SelectItem value="system">System</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Account Information */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5"/>
						Account Information
					</CardTitle>
					<CardDescription>
						View detailed information about your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground">Account ID</Label>
							<div className="font-mono text-sm bg-muted p-2">
								usr_1234567890abcdef
							</div>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground">Created</Label>
							<div className="text-sm">
								January 15, 2024
							</div>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground">Last Login</Label>
							<div className="text-sm">
								2 hours ago
							</div>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
							<Badge variant="secondary">Premium</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="border-destructive">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<Trash2 className="h-5 w-5"/>
						Danger Zone
					</CardTitle>
					<CardDescription>
						Irreversible and destructive actions
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">Show Danger Zone</div>
							<div className="text-sm text-muted-foreground">
								Reveal destructive account actions
							</div>
						</div>
						<Switch
							checked={showDangerZone}
							onCheckedChange={setShowDangerZone}
						/>
					</div>

					{showDangerZone && (
						<>
							<Separator/>

							<Alert className="border-destructive">
								<AlertTriangle className="h-4 w-4"/>
								<AlertDescription>
									<strong>Warning:</strong> These actions cannot be undone. All your photos, albums,
									and account data will be permanently deleted.
								</AlertDescription>
							</Alert>

							<div className="space-y-4 p-4 border border-destructive">
								<div>
									<Label htmlFor="delete-confirmation" className="text-sm font-medium">
										Type "DELETE MY ACCOUNT" to confirm account deletion
									</Label>
									<Input
										id="delete-confirmation"
										value={deleteConfirmation}
										onChange={(e) => setDeleteConfirmation(e.target.value)}
										placeholder="DELETE MY ACCOUNT"
										className="mt-2"
									/>
								</div>

								<div className="flex gap-2">
									<Button
										variant="destructive"
										onClick={handleDeleteAccount}
										disabled={deleteConfirmation !== 'DELETE MY ACCOUNT'}
									>
										Delete Account
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setDeleteConfirmation('')
											setShowDangerZone(false)
										}}
									>
										Cancel
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
