'use client'

import {useState} from 'react'
import {AlertTriangle, Bell, Mail, Monitor, Settings, Share2, Shield, Smartphone, Upload} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Switch} from '@halycron/ui/components/switch'
import {Button} from '@halycron/ui/components/button'
import {Badge} from '@halycron/ui/components/badge'
import {Alert, AlertDescription} from '@halycron/ui/components/alert'
import {Separator} from '@halycron/ui/components/separator'

interface NotificationChannel {
	id: string
	name: string
	icon: React.ComponentType<{ className?: string }>
	enabled: boolean
	available: boolean
	description: string
}

interface NotificationCategory {
	id: string
	name: string
	description: string
	icon: React.ComponentType<{ className?: string }>
	notifications: NotificationItem[]
}

interface NotificationItem {
	id: string
	name: string
	description: string
	required: boolean
	channels: {
		push: boolean
		email: boolean
		inApp: boolean
	}
}

export const NotificationSettings = () => {
	const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'default'>('default')
	const [isRequestingPermission, setIsRequestingPermission] = useState(false)

	// Mock notification channels
	const [channels, setChannels] = useState<NotificationChannel[]>([
		{
			id: 'push',
			name: 'Push Notifications',
			icon: Smartphone,
			enabled: pushPermission === 'granted',
			available: 'Notification' in window,
			description: 'Receive notifications on your device'
		},
		{
			id: 'email',
			name: 'Email Notifications',
			icon: Mail,
			enabled: true,
			available: true,
			description: 'Receive notifications via email'
		},
		{
			id: 'inApp',
			name: 'In-App Notifications',
			icon: Monitor,
			enabled: true,
			available: true,
			description: 'See notifications when using the app'
		}
	])

	// Mock notification categories and settings
	const [categories, setCategories] = useState<NotificationCategory[]>([
		{
			id: 'security',
			name: 'Security & Account',
			description: 'Critical security events and account changes',
			icon: Shield,
			notifications: [
				{
					id: 'login',
					name: 'New Login',
					description: 'When someone logs into your account',
					required: true,
					channels: {push: true, email: true, inApp: true}
				},
				{
					id: 'password-change',
					name: 'Password Changed',
					description: 'When your password is changed',
					required: true,
					channels: {push: true, email: true, inApp: true}
				},
				{
					id: '2fa-change',
					name: 'Two-Factor Authentication',
					description: 'When 2FA settings are modified',
					required: true,
					channels: {push: true, email: true, inApp: true}
				},
				{
					id: 'suspicious-activity',
					name: 'Suspicious Activity',
					description: 'When unusual account activity is detected',
					required: true,
					channels: {push: true, email: true, inApp: true}
				},
				{
					id: 'device-added',
					name: 'New Device Added',
					description: 'When a new device accesses your account',
					required: false,
					channels: {push: true, email: true, inApp: false}
				}
			]
		},
		{
			id: 'uploads',
			name: 'Uploads & Processing',
			description: 'Photo upload status and processing updates',
			icon: Upload,
			notifications: [
				{
					id: 'upload-complete',
					name: 'Upload Complete',
					description: 'When photo uploads finish successfully',
					required: false,
					channels: {push: true, email: false, inApp: true}
				},
				{
					id: 'upload-failed',
					name: 'Upload Failed',
					description: 'When photo uploads encounter errors',
					required: false,
					channels: {push: true, email: true, inApp: true}
				},
				{
					id: 'processing-complete',
					name: 'Processing Complete',
					description: 'When photo processing and analysis finishes',
					required: false,
					channels: {push: false, email: false, inApp: true}
				},
				{
					id: 'storage-full',
					name: 'Storage Almost Full',
					description: 'When you\'re approaching storage limits',
					required: false,
					channels: {push: true, email: true, inApp: true}
				}
			]
		},
		{
			id: 'sharing',
			name: 'Sharing & Collaboration',
			description: 'Album sharing and collaboration activities',
			icon: Share2,
			notifications: [
				{
					id: 'album-shared',
					name: 'Album Shared With You',
					description: 'When someone shares an album with you',
					required: false,
					channels: {push: true, email: true, inApp: true}
				},
				{
					id: 'album-updated',
					name: 'Shared Album Updated',
					description: 'When photos are added to shared albums',
					required: false,
					channels: {push: false, email: false, inApp: true}
				},
				{
					id: 'share-expired',
					name: 'Share Link Expired',
					description: 'When your shared links expire',
					required: false,
					channels: {push: false, email: true, inApp: true}
				},
				{
					id: 'collaboration-invite',
					name: 'Collaboration Invite',
					description: 'When you\'re invited to collaborate on an album',
					required: false,
					channels: {push: true, email: true, inApp: true}
				}
			]
		},
		{
			id: 'system',
			name: 'System & Maintenance',
			description: 'System updates and maintenance notifications',
			icon: Settings,
			notifications: [
				{
					id: 'maintenance',
					name: 'Scheduled Maintenance',
					description: 'When system maintenance is scheduled',
					required: false,
					channels: {push: false, email: true, inApp: true}
				},
				{
					id: 'feature-updates',
					name: 'New Features',
					description: 'When new features are available',
					required: false,
					channels: {push: false, email: false, inApp: true}
				},
				{
					id: 'service-issues',
					name: 'Service Issues',
					description: 'When there are service disruptions',
					required: false,
					channels: {push: true, email: true, inApp: true}
				},
				{
					id: 'backup-status',
					name: 'Backup Status',
					description: 'Weekly backup status reports',
					required: false,
					channels: {push: false, email: true, inApp: false}
				}
			]
		}
	])

	const handleChannelToggle = (channelId: string) => {
		if (channelId === 'push' && pushPermission !== 'granted') {
			requestPushPermission()
			return
		}

		setChannels(prev => prev.map(channel => channel.id === channelId
			? {...channel, enabled: !channel.enabled}
			: channel))
	}

	const handleNotificationToggle = (categoryId: string, notificationId: string, channelType: keyof NotificationItem['channels']) => {
		setCategories(prev => prev.map(category => category.id === categoryId
			? {
				...category,
				notifications: category.notifications.map(notification => notification.id === notificationId
					? {
						...notification,
						channels: {
							...notification.channels,
							[channelType]: !notification.channels[channelType]
						}
					}
					: notification)
			}
			: category))
	}

	const requestPushPermission = async () => {
		if (!('Notification' in window)) {
			alert('This browser does not support notifications')
			return
		}

		setIsRequestingPermission(true)

		try {
			const permission = await Notification.requestPermission()
			setPushPermission(permission)

			if (permission === 'granted') {
				setChannels(prev => prev.map(channel => channel.id === 'push'
					? {...channel, enabled: true}
					: channel))
			}
		} catch (error) {
			console.error('Error requesting notification permission:', error)
		} finally {
			setIsRequestingPermission(false)
		}
	}

	const getEnabledChannelsCount = (notification: NotificationItem) => {
		return Object.values(notification.channels).filter(Boolean).length
	}

	const getTotalNotificationsCount = () => {
		return categories.reduce((total, category) => total + category.notifications.length, 0)
	}

	const getEnabledNotificationsCount = () => {
		return categories.reduce((total, category) => total + category.notifications.filter(notification => Object.values(notification.channels).some(Boolean)).length, 0)
	}

	return (
		<div className="space-y-6">
			{/* Overview */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Bell className="h-5 w-5"/>
						<CardTitle>Notification Preferences</CardTitle>
					</div>
					<CardDescription>
						Manage how and when you receive notifications from Halycron
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center p-4 bg-muted/50 rounded-lg">
							<div className="text-2xl font-bold text-primary">
								{getEnabledNotificationsCount()}/{getTotalNotificationsCount()}
							</div>
							<div className="text-sm text-muted-foreground">Active Notifications</div>
						</div>
						<div className="text-center p-4 bg-muted/50 rounded-lg">
							<div className="text-2xl font-bold text-primary">
								{channels.filter(c => c.enabled).length}/{channels.length}
							</div>
							<div className="text-sm text-muted-foreground">Active Channels</div>
						</div>
						<div className="text-center p-4 bg-muted/50 rounded-lg">
							<div className="text-2xl font-bold text-primary">
								{categories.filter(c => c.notifications.some(n => n.required)).length}
							</div>
							<div className="text-sm text-muted-foreground">Required Categories</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Notification Channels */}
			<Card>
				<CardHeader>
					<CardTitle>Notification Channels</CardTitle>
					<CardDescription>
						Choose how you want to receive notifications
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{channels.map((channel) => {
						const Icon = channel.icon
						return (
							<div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
								<div className="flex items-center gap-3">
									<Icon className="h-5 w-5 text-muted-foreground"/>
									<div>
										<div className="font-medium">{channel.name}</div>
										<div className="text-sm text-muted-foreground">{channel.description}</div>
										{!channel.available && (
											<Badge variant="secondary" className="mt-1">Not Available</Badge>
										)}
										{channel.id === 'push' && pushPermission === 'denied' && (
											<Badge variant="destructive" className="mt-1">Permission Denied</Badge>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									{channel.id === 'push' && pushPermission !== 'granted' && channel.available && (
										<Button
											variant="outline"
											size="sm"
											onClick={requestPushPermission}
											disabled={isRequestingPermission}
										>
											{isRequestingPermission ? 'Requesting...' : 'Enable'}
										</Button>
									)}
									<Switch
										checked={channel.enabled}
										onCheckedChange={() => handleChannelToggle(channel.id)}
										disabled={!channel.available || (channel.id === 'push' && pushPermission === 'denied')}
									/>
								</div>
							</div>
						)
					})}

					{pushPermission === 'denied' && (
						<Alert>
							<AlertTriangle className="h-4 w-4"/>
							<AlertDescription>
								Push notifications are blocked. You can enable them in your browser settings.
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Notification Categories */}
			{categories.map((category) => {
				const Icon = category.icon
				const hasRequiredNotifications = category.notifications.some(n => n.required)

				return (
					<Card key={category.id}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Icon className="h-5 w-5"/>
									<div>
										<CardTitle className="flex items-center gap-2">
											{category.name}
											{hasRequiredNotifications && (
												<Badge variant="secondary">Required</Badge>
											)}
										</CardTitle>
										<CardDescription>{category.description}</CardDescription>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{category.notifications.map((notification, index) => (
									<div key={notification.id}>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium">{notification.name}</span>
													{notification.required && (
														<Badge variant="outline" className="text-xs">Required</Badge>
													)}
												</div>
												<p className="text-sm text-muted-foreground mb-3">
													{notification.description}
												</p>

												{/* Channel toggles */}
												<div className="flex items-center gap-4">
													{channels.map((channel) => {
														const channelKey = channel.id as keyof NotificationItem['channels']
														const isChannelEnabled = channels.find(c => c.id === channel.id)?.enabled
														const isNotificationEnabled = notification.channels[channelKey]

														return (
															<div key={channel.id} className="flex items-center gap-2">
																<Switch
																	checked={isNotificationEnabled}
																	onCheckedChange={() => handleNotificationToggle(category.id, notification.id, channelKey)}
																	disabled={notification.required || !isChannelEnabled}
																/>
																<span
																	className="text-sm text-muted-foreground capitalize">
																	{channel.id === 'inApp' ? 'In-App' : channel.name.split(' ')[0]}
																</span>
															</div>
														)
													})}
												</div>
											</div>

											<div className="ml-4">
												<Badge variant="outline">
													{getEnabledChannelsCount(notification)} of {channels.length} channels
												</Badge>
											</div>
										</div>

										{index < category.notifications.length - 1 && (
											<Separator className="mt-4"/>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)
			})}

			{/* Additional Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Additional Settings</CardTitle>
					<CardDescription>
						Advanced notification preferences
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">Quiet Hours</div>
							<div className="text-sm text-muted-foreground">
								Pause non-critical notifications during specified hours
							</div>
						</div>
						<Switch/>
					</div>

					<Separator/>

					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">Digest Mode</div>
							<div className="text-sm text-muted-foreground">
								Receive daily summary instead of individual notifications
							</div>
						</div>
						<Switch/>
					</div>

					<Separator/>

					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium">Sound Notifications</div>
							<div className="text-sm text-muted-foreground">
								Play sound for push notifications
							</div>
						</div>
						<Switch defaultChecked/>
					</div>
				</CardContent>
			</Card>

			{/* Help Text */}
			<Alert>
				<Bell className="h-4 w-4"/>
				<AlertDescription>
					<strong>Note:</strong> Security notifications marked as "Required" cannot be disabled as they are
					essential for account protection.
					You can still choose which channels to receive them through.
				</AlertDescription>
			</Alert>
		</div>
	)
}
