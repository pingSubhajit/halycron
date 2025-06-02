import React, {createContext, useContext, useEffect, useState} from 'react'
import {authClient} from '@/src/lib/auth-client'
import {Session, User} from 'better-auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {Route, router, SplashScreen} from 'expo-router'
import CustomSplashScreen from '@/src/components/splash-screen'
import * as Linking from 'expo-linking'
import * as QuickActions from 'expo-quick-actions'

interface SessionContextValue {
	session: Session | null;
	user: User | null;
	initialRoute: Route | null;
	status: 'loading' | 'authenticated' | 'unauthenticated';
	signOut: () => Promise<void>;
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

	const {data: sessionData, isPending} = authClient.useSession()

	// Effect to update and persist session when it changes from auth client
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

	// Check auth state and set the initial route
	useEffect(() => {
		const checkAuthAndSetInitialRoute = async () => {
			try {
				if (!isPending) {
					setTimeout(async () => {
						// Use sessionData from an auth client as the source of truth, with fallback to local sessionState
						const currentSession = sessionData?.session || sessionState

						if (currentSession?.id) {
							// Check for an initial deep link
							const initialUrl = await Linking.getInitialURL()
							if (initialUrl) {
								const parsed = Linking.parse(initialUrl)
								const isHttpsSharedLink = parsed.hostname === 'halycron.space' && parsed.path?.startsWith('/shared/')
								const isCustomSchemeSharedLink = parsed.scheme === 'halycron' && parsed.path?.startsWith('/shared/')

								if (isHttpsSharedLink || isCustomSchemeSharedLink) {
									const token = parsed.path?.replace('/shared/', '')
									if (token) {
										setInitialRoute(`/shared/${token}`)
										SplashScreen.hideAsync()
										return
									}
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
				signOut
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
