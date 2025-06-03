'use client'

import React, {useCallback, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Badge} from '@halycron/ui/components/badge'
import {Separator} from '@halycron/ui/components/separator'
import {CheckCircle, Clock, Eye, Key, Loader2, Shield} from 'lucide-react'
import {createAuthClient} from 'better-auth/react'
import {toast} from 'sonner'

const {useSession, listSessions, revokeSession, revokeOtherSessions} = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'
})

interface SessionData {
	id: string
	token: string
	expiresAt: Date
	ipAddress?: string | null
	userAgent?: string | null
	createdAt: Date
	updatedAt: Date
	userId: string
}

export const SecuritySettings = () => {
	const {data: session} = useSession()
	const [sessions, setSessions] = useState<SessionData[]>([])
	const [loadingSessions, setLoadingSessions] = useState(false)
	const [revoking, setRevoking] = useState<string | null>(null)
	const [revokingAll, setRevokingAll] = useState(false)

	const handlePasswordChange = () => {
		// TODO: Implement password change modal/flow
	}

	// Fetch sessions data
	const fetchSessions = useCallback(async () => {
		if (!session?.user?.id) return

		try {
			setLoadingSessions(true)
			const result = await listSessions()
			if (result.data) {
				setSessions(result.data)
			}
		} catch (error) {
			console.error('Failed to fetch sessions:', error)
			toast.error('Failed to load sessions')
		} finally {
			setLoadingSessions(false)
		}
	}, [session?.user?.id])

	// Handle individual session revocation
	const handleRevokeSession = async (sessionToken: string) => {
		try {
			setRevoking(sessionToken)
			const result = await revokeSession({token: sessionToken})

			if (result.error) {
				throw new Error(result.error.message)
			}

			// Remove from local state
			setSessions(prev => prev.filter(s => s.token !== sessionToken))
			toast.success('Session revoked successfully')
		} catch (error) {
			console.error('Failed to revoke session:', error)
			toast.error('Failed to revoke session')
		} finally {
			setRevoking(null)
		}
	}

	// Handle revoking all other sessions
	const handleRevokeAllOthers = async () => {
		try {
			setRevokingAll(true)
			const result = await revokeOtherSessions()

			if (result.error) {
				throw new Error(result.error.message)
			}

			// Keep only current session
			const currentSession = sessions.find(s => s.token === session?.session?.token)
			setSessions(currentSession ? [currentSession] : [])
			toast.success('All other sessions revoked successfully')
		} catch (error) {
			console.error('Failed to revoke other sessions:', error)
			toast.error('Failed to revoke other sessions')
		} finally {
			setRevokingAll(false)
		}
	}

	// Load sessions on mount
	React.useEffect(() => {
		fetchSessions()
	}, [fetchSessions])

	// Helper function to format session info
	const formatSessionInfo = (sessionData: SessionData) => {
		const userAgent = sessionData.userAgent || ''
		const isCurrentSession = sessionData.token === session?.session?.token

		// Debug logging to see user agents and session info (remove in production)
		if (process.env.NODE_ENV === 'development') {
			console.log('Session User Agent:', userAgent)
			console.log('Session Data:', {
				id: sessionData.id,
				userAgent: sessionData.userAgent,
				ipAddress: sessionData.ipAddress,
				createdAt: sessionData.createdAt
			})
		}

		// Extract device and OS info from user agent
		let deviceInfo = 'Unknown Device'
		let platform = ''
		let browserName = ''

		// Check for Halycron mobile app first (Expo/React Native)
		if (userAgent.includes('Halycron-Mobile') || userAgent.includes('Expo') || userAgent.includes('com.halycron.app') || userAgent.includes('halycron')) {
			deviceInfo = 'Halycron Mobile App'

			// Detect mobile OS with better precision
			if (userAgent.includes('Halycron-Mobile/iOS') || userAgent.includes('iPhone') || userAgent.includes('iOS')) {
				platform = 'iOS'
				// Extract iOS version if available
				const iosMatch = userAgent.match(/iOS[\s\/]?(\d+[\.\d]*)/i) || userAgent.match(/\((\d+[\.\d]*)\)/)
				if (iosMatch) platform = `iOS ${iosMatch[1]}`
			} else if (userAgent.includes('Halycron-Mobile/Android') || userAgent.includes('Android')) {
				platform = 'Android'
				// Extract Android version if available
				const androidMatch = userAgent.match(/Android[\s\/]?(\d+[\.\d]*)/i) || userAgent.match(/\((\d+[\.\d]*)\)/)
				if (androidMatch) platform = `Android ${androidMatch[1]}`
			}
		}
		// Check for OkHttp (React Native default on Android) or similar patterns
		else if (userAgent.includes('okhttp') || userAgent.includes('OkHttp')) {
			deviceInfo = 'Halycron Mobile App'
			platform = 'Android'
			// Try to extract OkHttp version
			const okhttpMatch = userAgent.match(/okhttp\/([\d\.]+)/i)
			if (okhttpMatch) {
				platform = `Android (OkHttp ${okhttpMatch[1]})`
			}
		}
		// Check for other React Native patterns (iOS)
		else if (userAgent.includes('CFNetwork') || (userAgent.includes('Darwin') && userAgent.includes('iPhone'))) {
			deviceInfo = 'Halycron Mobile App'
			platform = 'iOS'
			// Try to extract iOS version from Darwin string
			const darwinMatch = userAgent.match(/Darwin\/([\d\.]+)/)
			const iosMatch = userAgent.match(/iPhone.*?(\d+_\d+)/)
			if (iosMatch && iosMatch[1]) {
				const version = iosMatch[1].replace('_', '.')
				platform = `iOS ${version}`
			} else if (darwinMatch && darwinMatch[1]) {
				platform = `iOS (Darwin ${darwinMatch[1]})`
			}
		}
		// Check for other mobile browsers/apps
		else if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
			// Mobile browsers
			if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
				platform = 'iOS'
				if (userAgent.includes('CriOS')) {
					deviceInfo = 'Mobile Chrome'
					browserName = 'Chrome'
				} else if (userAgent.includes('FxiOS')) {
					deviceInfo = 'Mobile Firefox'
					browserName = 'Firefox'
				} else if (userAgent.includes('Safari')) {
					deviceInfo = 'Mobile Safari'
					browserName = 'Safari'
				} else {
					deviceInfo = 'Mobile Browser'
				}
			} else if (userAgent.includes('Android')) {
				platform = 'Android'
				if (userAgent.includes('Chrome')) {
					deviceInfo = 'Mobile Chrome'
					browserName = 'Chrome'
				} else if (userAgent.includes('Firefox')) {
					deviceInfo = 'Mobile Firefox'
					browserName = 'Firefox'
				} else if (userAgent.includes('Samsung')) {
					deviceInfo = 'Samsung Internet'
					browserName = 'Samsung'
				} else {
					deviceInfo = 'Mobile Browser'
				}
			} else {
				deviceInfo = 'Mobile Browser'
			}
		}
		// Desktop browsers
		else {
			// Detect OS first
			if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
				platform = 'macOS'
			} else if (userAgent.includes('Windows NT')) {
				platform = 'Windows'
				// Get Windows version
				if (userAgent.includes('Windows NT 10.0')) platform = 'Windows 10/11'
				else if (userAgent.includes('Windows NT 6.3')) platform = 'Windows 8.1'
				else if (userAgent.includes('Windows NT 6.2')) platform = 'Windows 8'
				else if (userAgent.includes('Windows NT 6.1')) platform = 'Windows 7'
			} else if (userAgent.includes('Linux')) {
				platform = 'Linux'
				if (userAgent.includes('Ubuntu')) platform = 'Ubuntu'
				else if (userAgent.includes('Fedora')) platform = 'Fedora'
				else if (userAgent.includes('Debian')) platform = 'Debian'
			} else if (userAgent.includes('CrOS')) {
				platform = 'Chrome OS'
			}

			// Detect browser with version information
			if (userAgent.includes('Edg/')) {
				const edgeMatch = userAgent.match(/Edg\/([\d\.]+)/)
				deviceInfo = edgeMatch ? `Microsoft Edge ${edgeMatch[1]}` : 'Microsoft Edge'
				browserName = 'Edge'
			} else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg')) {
				const chromeMatch = userAgent.match(/Chrome\/([\d\.]+)/)
				deviceInfo = chromeMatch ? `Google Chrome ${chromeMatch[1]}` : 'Google Chrome'
				browserName = 'Chrome'
			} else if (userAgent.includes('Firefox/')) {
				const firefoxMatch = userAgent.match(/Firefox\/([\d\.]+)/)
				deviceInfo = firefoxMatch ? `Mozilla Firefox ${firefoxMatch[1]}` : 'Mozilla Firefox'
				browserName = 'Firefox'
			} else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
				const safariMatch = userAgent.match(/Version\/([\d\.]+).*Safari/)
				deviceInfo = safariMatch ? `Safari ${safariMatch[1]}` : 'Safari'
				browserName = 'Safari'
			} else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
				const operaMatch = userAgent.match(/(?:Opera|OPR)\/([\d\.]+)/)
				deviceInfo = operaMatch ? `Opera ${operaMatch[1]}` : 'Opera'
				browserName = 'Opera'
			} else {
				deviceInfo = 'Web Browser'
			}
		}

		// Fallback if still unknown
		if (deviceInfo === 'Unknown Device' && userAgent) {
			if (userAgent.toLowerCase().includes('mobile')) {
				deviceInfo = 'Mobile Device'
			} else {
				deviceInfo = 'Desktop Browser'
			}
		}

		// Format last active time
		const lastActive = isCurrentSession ? 'Now' : formatLastActive(sessionData.updatedAt)

		return {
			deviceInfo,
			platform,
			browserName,
			lastActive,
			isCurrentSession
		}
	}

	const formatLastActive = (timestamp: Date) => {
		const now = new Date()
		const sessionTime = timestamp
		const diffMs = now.getTime() - sessionTime.getTime()
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
		const diffDays = Math.floor(diffHours / 24)

		if (diffHours < 1) return 'Less than an hour ago'
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
		return sessionTime.toLocaleDateString()
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
						<div className="flex items-center gap-3 p-4 border">
							<div className="p-2 bg-green-500/10">
								<CheckCircle className="h-5 w-5 text-green-500"/>
							</div>
							<div>
								<div className="font-medium">Password Protected</div>
								<div className="text-sm text-muted-foreground">Strong password set</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 border">
							<div className="p-2 bg-blue-500/10">
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
					<div className="flex items-center justify-between p-4 border">
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

					<div className="p-4 bg-muted/30">
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
						{loadingSessions && <Loader2 className="h-4 w-4 animate-spin"/>}
					</CardTitle>
					<CardDescription>
						Manage your active login sessions across devices
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{loadingSessions ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-6 w-6 animate-spin"/>
							<span className="ml-2">Loading sessions...</span>
						</div>
					) : (
						<div className="space-y-3">
							{sessions.length === 0 ? (
								<div className="text-center p-8 text-muted-foreground">
									No active sessions found
								</div>
							) : (
								sessions.map((sessionData) => {
									const sessionInfo = formatSessionInfo(sessionData)
									const isRevoking = revoking === sessionData.token

									return (
										<div
											key={sessionData.id}
											className={`flex items-center justify-between p-4 border ${
												sessionInfo.isCurrentSession ? 'bg-primary/5' : ''
											}`}
										>
											<div>
												<div className="font-medium flex items-center gap-2">
													{sessionInfo.isCurrentSession ? 'Current Session' : sessionInfo.deviceInfo}
													{sessionInfo.isCurrentSession && (
														<Badge variant="outline" className="text-xs">This device</Badge>
													)}
												</div>
												<div className="text-sm text-muted-foreground">
													{sessionInfo.platform && (
														<span>{sessionInfo.platform} • </span>
													)}
													Last active: {sessionInfo.lastActive}
													{sessionData.ipAddress && (
														<span className="ml-2 text-xs opacity-75">
															• {sessionData.ipAddress}
														</span>
													)}
												</div>
											</div>

											{sessionInfo.isCurrentSession ? (
												<Badge variant="default"
													className="bg-green-500/10 text-green-500 border-green-500/20">
													Active
												</Badge>
											) : (
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleRevokeSession(sessionData.token)}
													disabled={isRevoking}
												>
													{isRevoking ? (
														<>
															<Loader2 className="h-3 w-3 animate-spin mr-1"/>
															Signing Out...
														</>
													) : (
														'Sign Out'
													)}
												</Button>
											)}
										</div>
									)
								})
							)}
						</div>
					)}

					{sessions.length > 1 && (
						<>
							<Separator/>

							<div className="flex justify-between items-center">
								<div className="text-sm text-muted-foreground">
									Sign out of all other sessions for security
								</div>
								<Button
									variant="outline"
									onClick={handleRevokeAllOthers}
									disabled={revokingAll || sessions.length <= 1}
								>
									{revokingAll ? (
										<>
											<Loader2 className="h-3 w-3 animate-spin mr-2"/>
											Signing Out All...
										</>
									) : (
										'Sign Out All Others'
									)}
								</Button>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
