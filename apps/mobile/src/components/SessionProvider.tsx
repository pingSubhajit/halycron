import React, {createContext, useContext} from 'react'
import {authClient} from '@/src/lib/auth-client'
import {Session, User} from 'better-auth'

interface SessionContextValue {
	session: Session | null;
	user: User | null;
	status: 'loading' | 'authenticated' | 'unauthenticated';
	signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({children}: { children: React.ReactNode }) {
	const {data: sessionData} = authClient.useSession()
	const session = sessionData?.session || null
	const user = sessionData?.user || null

	const signOut = async () => {
		try {
			await authClient.signOut()
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<SessionContext.Provider
			value={{
				session,
				user,
				status: session ? 'authenticated' : 'unauthenticated',
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
