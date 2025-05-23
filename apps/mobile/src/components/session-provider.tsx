import React, {createContext, useContext, useEffect, useState} from 'react'
import {authClient} from '@/src/lib/auth-client'
import {Session, User} from 'better-auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SessionContextValue {
	session: Session | null;
	user: User | null;
	status: 'loading' | 'authenticated' | 'unauthenticated';
	signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

// Storage keys
const SESSION_STORAGE_KEY = 'halycron_auth_session'
const USER_STORAGE_KEY = 'halycron_auth_user'

export function SessionProvider({children}: { children: React.ReactNode }) {
	const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
	const [sessionState, setSessionState] = useState<Session | null>(null)
	const [userState, setUserState] = useState<User | null>(null)

	const {data: sessionData} = authClient.useSession()

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
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<SessionContext.Provider
			value={{
				session: sessionState,
				user: userState,
				status,
				signOut
			}}
		>
			{children}
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
