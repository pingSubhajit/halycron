'use client'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Badge} from '@halycron/ui/components/badge'
import {Separator} from '@halycron/ui/components/separator'
import {CheckCircle, Clock, Eye, Key, Shield} from 'lucide-react'
import {createAuthClient} from 'better-auth/react'

const {useSession} = createAuthClient()

export const SecuritySettings = () => {
	const {data: session} = useSession()

	const handlePasswordChange = () => {
		// TODO: Implement password change modal/flow
	}

	return (
		<div className="space-y-6">
			{/* Security Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5"/>
						Security Overview
					</CardTitle>
					<CardDescription>
						Your account security status and recommendations
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-green-500/10 rounded-lg">
								<CheckCircle className="h-5 w-5 text-green-500"/>
							</div>
							<div>
								<div className="font-medium">Password Protected</div>
								<div className="text-sm text-muted-foreground">Strong password set</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 border rounded-lg">
							<div className="p-2 bg-blue-500/10 rounded-lg">
								<Eye className="h-5 w-5 text-blue-500"/>
							</div>
							<div>
								<div className="font-medium">Privacy Mode</div>
								<div className="text-sm text-muted-foreground">Zero-knowledge</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Password Management */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Key className="h-5 w-5"/>
						Password Management
					</CardTitle>
					<CardDescription>
						Manage your account password and security
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<div className="font-medium">Current Password</div>
							<div className="text-sm text-muted-foreground">
								Last changed: {session?.user ? 'Recently' : 'Unknown'}
							</div>
						</div>
						<Button onClick={handlePasswordChange} variant="outline">
							Change Password
						</Button>
					</div>

					<div className="p-4 bg-muted/30 rounded-lg">
						<h4 className="font-medium mb-2">Password Requirements</h4>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• At least 12 characters long</li>
							<li>• Include uppercase and lowercase letters</li>
							<li>• Include at least one number</li>
							<li>• Include at least one special character</li>
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* Active Sessions */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5"/>
						Active Sessions
					</CardTitle>
					<CardDescription>
						Manage your active login sessions across devices
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						{/* Current Session */}
						<div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
							<div>
								<div className="font-medium flex items-center gap-2">
									Current Session
									<Badge variant="outline" className="text-xs">This device</Badge>
								</div>
								<div className="text-sm text-muted-foreground">
									Web Browser • Last active: Now
								</div>
							</div>
							<Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
								Active
							</Badge>
						</div>

						{/* Other Sessions */}
						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div>
								<div className="font-medium">Mobile App</div>
								<div className="text-sm text-muted-foreground">
									iOS • Last active: 2 hours ago
								</div>
							</div>
							<Button variant="outline" size="sm">
								Sign Out
							</Button>
						</div>

						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div>
								<div className="font-medium">Web Browser</div>
								<div className="text-sm text-muted-foreground">
									Chrome on macOS • Last active: 1 day ago
								</div>
							</div>
							<Button variant="outline" size="sm">
								Sign Out
							</Button>
						</div>
					</div>

					<Separator/>

					<div className="flex justify-between items-center">
						<div className="text-sm text-muted-foreground">
							Sign out of all other sessions for security
						</div>
						<Button variant="outline">
							Sign Out All Others
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
