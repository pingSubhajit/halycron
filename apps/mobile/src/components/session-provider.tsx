import React, {createContext, useContext, useEffect, useState} from 'react'
import {authClient} from '@/src/lib/auth-client'
import {Session, User} from 'better-auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {Route, router, SplashScreen} from 'expo-router'
import CustomSplashScreen from '@/src/components/splash-screen'
import * as Linking from 'expo-linking'

interface SessionContextValue {
	session: Session | null;
	user: User | null;
	initialRoute: Route | null;
	status: 'loading' | 'authenticated' | 'unauthenticated';
	signOut: () => Promise<void>;
	pendingSharedRoute: string | null;
	setPendingSharedRoute: (route: string | null) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

// Storage keys
const SESSION_STORAGE_KEY = 'halycron_auth_session'
const USER_STORAGE_KEY = 'halycron_auth_user'

export function SessionProvider({children}: { children: React.ReactNode }) {
	const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
	const [sessionState, setSessionState] = useState<Session | null>(null)
	const [userState, setUserState] = useState<User | null>(null)
	const [initialRoute, setInitialRoute] = useState<string | null>(null)
	const [pendingSharedRoute, setPendingSharedRoute] = useState<string | null>(null)
	const [hasHandledInitialUrl, setHasHandledInitialUrl] = useState(false)

	const {data: sessionData, isPending} = authClient.useSession()

	// Effect to update and persist the session when it changes from the auth client
	useEffect(() => {
		const handleSessionUpdate = async () => {
			if (sessionData?.session) {
				// Save session to storage
				await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData.session))
				await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionData.user))

				setSessionState(sessionData.session)
				setUserState(sessionData.user)
				setStatus('authenticated')
			}
		}

		handleSessionUpdate()
	}, [sessionData])

	// Effect to restore session on app launch
	useEffect(() => {
		const restoreSession = async () => {
			try {
				const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY)
				const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY)

				if (storedSession && storedUser) {
					const sessionObj = JSON.parse(storedSession)
					const userObj = JSON.parse(storedUser)

					// Check if token is expired
					const expiresAt = sessionObj.expiresAt || 0
					if (Date.now() < expiresAt) {
						setSessionState(sessionObj)
						setUserState(userObj)
						setStatus('authenticated')

						/*
						 * Attempt to rehydrate the session with authClient
						 * Note: We don't directly call setSession since it might not exist
						 * Instead, rely on the token being in storage and authClient's
						 * built-in mechanisms to restore from storage if available
						 */
						try {
							// Fetch current session to refresh it with stored data
							await authClient.getSession()
						} catch (error) {
							console.error('Error rehydrating session:', error)
						}
					} else {
						// Session expired, clean up storage
						clearSessionStorage()
						setStatus('unauthenticated')
					}
				} else {
					setStatus('unauthenticated')
				}
			} catch (error) {
				console.error('Error restoring session:', error)
				setStatus('unauthenticated')
			}
		}

		restoreSession()
	}, [])

	const clearSessionStorage = async () => {
		await AsyncStorage.removeItem(SESSION_STORAGE_KEY)
		await AsyncStorage.removeItem(USER_STORAGE_KEY)
	}

	const signOut = async () => {
		try {
			await authClient.signOut()
			await clearSessionStorage()
			setSessionState(null)
			setUserState(null)
			setStatus('unauthenticated')
			router.push('/onboarding')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	useEffect(() => {
		// Check auth state immediately on the app load
		const checkAuthAndSetInitialRoute = async () => {
			try {
				// Only check initial URL once to prevent overriding shared link routing
				if (!hasHandledInitialUrl) {
					// Check if app was opened from a shared deep link first, regardless of auth state
					const initialUrl = await Linking.getInitialURL()
					console.log('🔗 Checking initial URL:', initialUrl)

					if (initialUrl) {
						const parsed = Linking.parse(initialUrl)
						const isHttpsSharedLink = parsed.hostname === 'halycron.space' && parsed.path?.startsWith('/shared/')
						const isCustomSchemeSharedLink = parsed.scheme === 'halycron' && parsed.path?.startsWith('/shared/')
						const isSharedLink = isHttpsSharedLink || isCustomSchemeSharedLink

						if (isSharedLink) {
							/*
							 * If opened from a shared link, check authentication status
							 */
							const token = parsed.path?.replace('/shared/', '')
							if (token) {
								const sharedRoute = `/shared/${token}`
								console.log('🔗 App opened from shared link:', sharedRoute)

								// Check if user is already authenticated (has valid session)
								const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY)
								let isAuthenticated = false
								if (storedSession) {
									try {
										const sessionObj = JSON.parse(storedSession)
										isAuthenticated = sessionObj.expiresAt && sessionObj.expiresAt > Date.now()
									} catch (error) {
										console.error('Error parsing stored session:', error)
									}
								}

								if (isAuthenticated) {
									/*
									 * User is authenticated, set a pending shared route and go through normal auth flow
									 * This will trigger biometric auth, and after success, we'll navigate to the shared route
									 */
									console.log('🔗 User authenticated, setting pending shared route and navigating to home first')
									setPendingSharedRoute(sharedRoute)
									// Set initial route to home to trigger the authenticated flow
									setInitialRoute('/')
									setHasHandledInitialUrl(true)
									setTimeout(() => {
										SplashScreen.hideAsync()
									}, 2000)
									return
								} else {
									// User not authenticated, go directly to shared route
									console.log('🔗 User not authenticated, going directly to shared route:', sharedRoute)
									setInitialRoute(sharedRoute)
									setHasHandledInitialUrl(true)
									setTimeout(() => {
										SplashScreen.hideAsync()
									}, 1500)
									return
								}
							}
						}
					}

					// Mark that we've handled the initial URL check (even if no URL or not a shared link)
					setHasHandledInitialUrl(true)
				}

				/*
				 * Only proceed with normal auth flow if we haven't set an initial route yet
				 * and we're not pending and we've handled the initial URL
				 */
				if (!isPending && hasHandledInitialUrl && !initialRoute) {
					setTimeout(() => {
						// Use sessionData from auth client as the source of truth, with fallback to local sessionState
						const currentSession = sessionData?.session || sessionState

						if (currentSession?.id) {
							// Valid session, go home
							console.log('🚀 Normal auth flow: User authenticated, going to home')
							setInitialRoute('/')
						} else {
							// No session, go to onboarding
							console.log('🚀 Normal auth flow: User not authenticated, going to onboarding')
							setInitialRoute('/onboarding')
						}

						// Hide the splash screen once we've determined the route
						SplashScreen.hideAsync()
					}, 2000)
				}
			} catch (error) {
				console.error('Error in checkAuthAndSetInitialRoute:', error)
				setInitialRoute('/onboarding')
				setHasHandledInitialUrl(true)
				SplashScreen.hideAsync()
			}
		}

		checkAuthAndSetInitialRoute()
	}, [sessionState, sessionData, isPending, hasHandledInitialUrl, initialRoute])

	return (
		<SessionContext.Provider
			value={{
				session: sessionState,
				user: userState,
				initialRoute,
				status,
				signOut,
				pendingSharedRoute,
				setPendingSharedRoute
			}}
		>
			{!initialRoute && <CustomSplashScreen/>}
			{initialRoute && children}
		</SessionContext.Provider>
	)
}

export function useSession() {
	const context = useContext(SessionContext)
	if (context === undefined) {
		throw new Error('useSession must be used within a SessionProvider')
	}
	return context
}
