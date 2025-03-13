'use client'

import {useEffect, useRef} from 'react'
import {useLogout} from '@/lib/auth/use-logout'
import {createAuthClient} from 'better-auth/react'
import {toast} from 'sonner'

const {useSession} = createAuthClient()

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
const isLocalEnvironment = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.includes('localhost')

export const ActivityTracker = () => {
	const {data: session} = useSession()
	const {logout} = useLogout()
	const timeoutRef = useRef<NodeJS.Timeout>(null)

	useEffect(() => {
		// Don't track inactivity if not logged in or in local environment
		if (!session || isLocalEnvironment) return

		const resetTimer = () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}

			timeoutRef.current = setTimeout(() => {
				if (session) {
					toast('For your security, we\'ve signed you out after a period of inactivity')
					logout()
				}
			}, INACTIVITY_TIMEOUT)
		}

		// Reset timer on mount
		resetTimer()

		// Add event listeners for user activity
		const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

		const handleActivity = () => {
			resetTimer()
		}

		events.forEach(event => {
			document.addEventListener(event, handleActivity)
		})

		return () => {
			// Cleanup
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
			events.forEach(event => {
				document.removeEventListener(event, handleActivity)
			})
		}
	}, [logout, session])

	return null
}
