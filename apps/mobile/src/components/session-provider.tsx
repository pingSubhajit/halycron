import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import {authClient} from '@/src/lib/auth-client'
import {Session, User} from 'better-auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {Route, router, SplashScreen} from 'expo-router'
import CustomSplashScreen from '@/src/components/splash-screen'
import * as Linking from 'expo-linking'
import * as QuickActions from 'expo-quick-actions'
import {vaultForgetThisDevice} from '@/src/lib/crypto/vault'
import {AppState} from 'react-native'
import {
	CachedProfileData,
	clearProfileCache,
	extractFirstName,
	getCachedProfile,
	setCachedProfile
} from '@/src/lib/profile-cache'

export interface CachedProfile {
	firstName: string | null
	profilePictureUrl: string | null
	isLoading: boolean
}

interface SessionContextValue {
	session: Session | null;
	user: User | null;
	initialRoute: Route | null;
	status: 'loading' | 'authenticated' | 'unauthenticated';
	cachedProfile: CachedProfile;
	signOut: () => Promise<void>;
	setSessionData: (session: Session, user: User) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

// Storage keys
const SESSION_STORAGE_KEY = 'halycron_auth_session'
const USER_STORAGE_KEY = 'halycron_auth_user'

export const SessionProvider = ({children}: { children: React.ReactNode }) => {
	const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
	const [sessionState, setSessionState] = useState<Session | null>(null)
	const [userState, setUserState] = useState<User | null>(null)
	const [initialRoute, setInitialRoute] = useState<string | null>(null)
	const [cachedProfile, setCachedProfileState] = useState<CachedProfile>({
		firstName: null,
		profilePictureUrl: null,
		isLoading: true
	})
	const lastUserKeyRef = useRef<string | null>(null)
	const lastProfileKeyRef = useRef<string | null>(null)
	const lastSessionRefreshAttemptMsRef = useRef<number>(0)

	const {data: sessionData, isPending} = authClient.useSession()

	const getExpiresAtMs = (sessionObj: any): number => {
		const raw = sessionObj?.expiresAt
		if (raw instanceof Date) return raw.getTime()
		if (typeof raw === 'number') {
			// Some libs return seconds; normalize to ms.
			return raw < 1_000_000_000_000 ? raw * 1000 : raw
		}
		if (typeof raw === 'string') {
			const parsed = Date.parse(raw)
			return Number.isFinite(parsed) ? parsed : 0
		}
		return 0
	}

	const getUserKey = (user: User | null | undefined): string | null => {
		if (!user) return null
		// Prefer stable identifiers if available; fall back to email/name.
		const anyUser = user as unknown as Record<string, unknown>
		const id = typeof anyUser.id === 'string' ? anyUser.id : null
		const email = typeof anyUser.email === 'string' ? anyUser.email : null
		const name = typeof anyUser.name === 'string' ? anyUser.name : null
		return id || email || name
	}

	// Effect to update and persist session when it changes from auth client
	useEffect(() => {
		const handleSessionUpdate = async () => {
			if (sessionData?.session) {
				// If the authenticated user changed (eg. QR-login or switching accounts), clear device-cached UMK.
				const nextUserKey = getUserKey(sessionData.user)
				const prevUserKey = lastUserKeyRef.current ?? getUserKey(userState)
				if (prevUserKey && nextUserKey && prevUserKey !== nextUserKey) {
					await vaultForgetThisDevice().catch(() => {})
					// Also clear profile cache when user changes
					await clearProfileCache().catch(() => {})
				}
				lastUserKeyRef.current = nextUserKey

				// Save session to storage
				await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData.session))
				await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionData.user))

				// Update profile cache if name or profile picture changed
				const currentUser = sessionData.user
				const currentProfileKey = currentUser?.image || null
				const firstName = extractFirstName(currentUser?.name)
				
				// Check if profile data has changed from what we have cached
				const profileKeyChanged = lastProfileKeyRef.current !== currentProfileKey
				const firstNameChanged = cachedProfile.firstName !== firstName
				
				if (profileKeyChanged || firstNameChanged || !lastProfileKeyRef.current) {
					lastProfileKeyRef.current = currentProfileKey
					
					// Update the cached profile state
					setCachedProfileState({
						firstName,
						profilePictureUrl: null, // Will be fetched by profile-picture component
						isLoading: false
					})
					
					// Persist to device storage
					await setCachedProfile({
						firstName,
						profilePictureUrl: null,
						profilePictureKey: currentProfileKey,
						cachedAt: Date.now()
					}).catch(() => {})
				}

				setSessionState(sessionData.session)
				setUserState(sessionData.user)
				setStatus('authenticated')
			}
		}

		handleSessionUpdate()
	}, [sessionData, userState])

	// Effect to restore session and cached profile on app launch
	useEffect(() => {
		const restoreSession = async () => {
			try {
				// Restore cached profile immediately for instant UI
				const cachedProfileData = await getCachedProfile()
				if (cachedProfileData) {
					setCachedProfileState({
						firstName: cachedProfileData.firstName,
						profilePictureUrl: cachedProfileData.profilePictureUrl,
						isLoading: false
					})
					lastProfileKeyRef.current = cachedProfileData.profilePictureKey
				}

				const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY)
				const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY)

				if (storedSession && storedUser) {
					const sessionObj = JSON.parse(storedSession)
					const userObj = JSON.parse(storedUser)

					// Check if token is expired
					const expiresAtMs = getExpiresAtMs(sessionObj)
					if (expiresAtMs > 0 && Date.now() < expiresAtMs) {
						setSessionState(sessionObj)
						setUserState(userObj)
						setStatus('authenticated')

						// If we have a cached profile, mark loading as false
						// The actual profile will be updated when sessionData comes in
						if (cachedProfileData) {
							setCachedProfileState(prev => ({...prev, isLoading: false}))
						}

						/*
						 * Attempt to rehydrate the session with authClient
						 * Note: We don't directly call setSession since it might not exist
						 * Instead, rely on the token being in storage and authClient's
						 * built-in mechanisms to restore from storage if available
						 */
						try {
							// Fetch current session (server may extend rolling expiry).
							await authClient.getSession()
						} catch (error) {
							console.error('Error rehydrating session:', error)
						}
					} else {
						// Session expired, clean up storage
						// Keep the last known user key so we can detect account switches and clear cached UMK on next login.
						lastUserKeyRef.current = getUserKey(userObj)
						await clearSessionStorage()
						// Also clear profile cache on session expiry
						await clearProfileCache().catch(() => {})
						setCachedProfileState({firstName: null, profilePictureUrl: null, isLoading: false})
						setStatus('unauthenticated')
					}
				} else {
					setCachedProfileState(prev => ({...prev, isLoading: false}))
					setStatus('unauthenticated')
				}
			} catch (error) {
				console.error('Error restoring session:', error)
				setCachedProfileState(prev => ({...prev, isLoading: false}))
				setStatus('unauthenticated')
			}
		}

		restoreSession()
	}, [])

	// When the app returns to foreground, attempt to refresh the session.
	// This prevents surprise logouts caused by a fixed server-side session expiry window.
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (state) => {
			if (state !== 'active') return
			if (!sessionState?.id) return

			// Throttle refresh attempts (avoid spamming on quick app switches).
			const now = Date.now()
			if (now - lastSessionRefreshAttemptMsRef.current < 5 * 60 * 1000) return
			lastSessionRefreshAttemptMsRef.current = now

			authClient.getSession().catch((error) => {
				console.error('Error refreshing session on foreground:', error)
			})
		})

		return () => subscription.remove()
	}, [sessionState?.id])

	const clearSessionStorage = async () => {
		await AsyncStorage.removeItem(SESSION_STORAGE_KEY)
		await AsyncStorage.removeItem(USER_STORAGE_KEY)
	}

	const signOut = async () => {
		try {
			await authClient.signOut()
		} catch (error) {
			// Even if remote sign-out fails, still clear local session + cached keys.
			console.error('Error signing out:', error)
		} finally {
			await clearSessionStorage().catch(() => {})
			await clearProfileCache().catch(() => {})
			await vaultForgetThisDevice().catch(() => {})
			lastUserKeyRef.current = null
			lastProfileKeyRef.current = null
			setSessionState(null)
			setUserState(null)
			setCachedProfileState({firstName: null, profilePictureUrl: null, isLoading: false})
			setStatus('unauthenticated')
			router.push('/onboarding')
		}
	}

	// Method to directly set session data (used by QR login)
	const setSessionData = async (session: Session, user: User) => {
		try {
			const nextUserKey = getUserKey(user)
			const prevUserKey = lastUserKeyRef.current ?? getUserKey(userState)
			if (prevUserKey && nextUserKey && prevUserKey !== nextUserKey) {
				await vaultForgetThisDevice().catch(() => {})
				await clearProfileCache().catch(() => {})
			}
			lastUserKeyRef.current = nextUserKey

			// Save to AsyncStorage
			await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
			await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
			
			// Update profile cache
			const firstName = extractFirstName(user?.name)
			const profileKey = user?.image || null
			lastProfileKeyRef.current = profileKey
			
			setCachedProfileState({
				firstName,
				profilePictureUrl: null,
				isLoading: false
			})
			
			await setCachedProfile({
				firstName,
				profilePictureUrl: null,
				profilePictureKey: profileKey,
				cachedAt: Date.now()
			}).catch(() => {})
			
			// Update state immediately
			setSessionState(session)
			setUserState(user)
			setStatus('authenticated')
		} catch (error) {
			console.error('Error setting session data:', error)
			throw error
		}
	}

	// Check auth state and set the initial route
	useEffect(() => {
		const checkAuthAndSetInitialRoute = async () => {
			try {
				if (!isPending) {
					setTimeout(async () => {
						// First: honor password reset deep links even when unauthenticated.
						let unauthInitialUrl = await Linking.getInitialURL()
						if (!unauthInitialUrl) {
							for (let i = 0; i < 3; i++) {
								await new Promise(resolve => setTimeout(resolve, 500))
								unauthInitialUrl = await Linking.getInitialURL()
								if (unauthInitialUrl) break
							}
						}

						if (unauthInitialUrl) {
							try {
								const parsed = Linking.parse(unauthInitialUrl)
								const path = parsed.path || ''
								const isResetLink = parsed.scheme === 'halycron' && (path === 'reset-password' || path.startsWith('reset-password'))
								if (isResetLink) {
									// Preserve query params so ResetPassword can read token/error reliably.
									const qp = parsed.queryParams || {}
									const tokenParam = typeof qp.token === 'string' ? qp.token : Array.isArray(qp.token) ? qp.token[0] : undefined
									const errorParam = typeof qp.error === 'string' ? qp.error : Array.isArray(qp.error) ? qp.error[0] : undefined

									const query = new URLSearchParams(
										{
											...(tokenParam ? {token: tokenParam} : {}),
											...(errorParam ? {error: errorParam} : {})
										}
									).toString()

									setInitialRoute(query ? `/reset-password?${query}` : '/reset-password')
									SplashScreen.hideAsync()
									return
								}
							} catch {
								// ignore parsing errors and continue normal routing
							}
						}

						// Use sessionData from an auth client as the source of truth, with fallback to local sessionState
						const currentSession = sessionData?.session || sessionState

						if (currentSession?.id) {
							// Check for an initial deep link with a retry mechanism
							let initialUrl = await Linking.getInitialURL()

							// If the initial URL is null, retry a few times (cold launch issue)
							if (!initialUrl) {
								for (let i = 0; i < 3; i++) {
									await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
									initialUrl = await Linking.getInitialURL()
									if (initialUrl) break
								}
							}

							if (initialUrl) {
								// Try multiple parsing approaches for better compatibility
								let token = null

								// Approach 1: Use expo-linking parse
								try {
									const parsed = Linking.parse(initialUrl)
									const isHttpsSharedLink = parsed.hostname === 'halycron.space' && parsed.path?.startsWith('/shared/')
									const isCustomSchemeSharedLink = parsed.scheme === 'halycron' && parsed.path?.startsWith('/shared/')

									if (isHttpsSharedLink || isCustomSchemeSharedLink) {
										token = parsed.path?.replace('/shared/', '')
									}
								} catch (error) {
									// Expo parsing failed, try fallback approaches
								}

								// Approach 2: Use URL constructor as fallback
								if (!token) {
									try {
										const urlObj = new URL(initialUrl)
										const isHttpsSharedLink = urlObj.hostname === 'halycron.space' && urlObj.pathname?.startsWith('/shared/')
										const isCustomSchemeSharedLink = initialUrl.startsWith('halycron://') && urlObj.pathname?.startsWith('/shared/')

										if (isHttpsSharedLink || isCustomSchemeSharedLink) {
											token = urlObj.pathname?.replace('/shared/', '')
										}
									} catch (error) {
										// URL constructor failed, try string matching
									}
								}

								// Approach 3: Simple string matching as final fallback
								if (!token && initialUrl.includes('/shared/')) {
									const match = initialUrl.match(/\/shared\/([^/?]+)/)
									if (match && match[1]) {
										token = match[1]
									}
								}

								if (token) {
									setInitialRoute(`/shared/${token}`)
									SplashScreen.hideAsync()
									return
								}
							}

							// Check for an initial quick action
							if (QuickActions.initial?.id === 'upload') {
								setInitialRoute('/(app)/upload')
								SplashScreen.hideAsync()
								return
							}

							// No special context, go home
							setInitialRoute('/')
						} else {
							// No session, go to onboarding
							setInitialRoute('/onboarding')
						}

						// Hide the splash screen once we've determined the route
						SplashScreen.hideAsync()
					}, 2000)
				}
			} catch (error) {
				setInitialRoute('/onboarding')
				SplashScreen.hideAsync()
			}
		}

		checkAuthAndSetInitialRoute()
	}, [sessionState, sessionData, isPending])

	return (
		<SessionContext.Provider
			value={{
				session: sessionState,
				user: userState,
				initialRoute,
				status,
				cachedProfile,
				signOut,
				setSessionData
			}}
		>
			{!initialRoute && <CustomSplashScreen/>}
			{initialRoute && children}
		</SessionContext.Provider>
	)
}

export const useSession = () => {
	const context = useContext(SessionContext)
	if (context === undefined) {
		throw new Error('useSession must be used within a SessionProvider')
	}
	return context
}
