import {useEffect, useRef} from 'react'
import {useRouter} from 'expo-router'
import {useSession} from '@/src/components/session-provider'

/**
 * Hook to handle authentication redirects
 * @param requireAuth - If true, redirects to login when not authenticated
 * @param redirectAuthenticatedTo - Path to redirect to if already authenticated
 * @param skipInitialRedirect - If true, only handles redirects on auth state changes, not on initial load
 */
export function useAuthRedirect({
	requireAuth = false,
	redirectAuthenticatedTo = '',
	skipInitialRedirect = false
}: {
	requireAuth?: boolean
	redirectAuthenticatedTo?: string
	skipInitialRedirect?: boolean
}) {
	const router = useRouter()
	const {status} = useSession()
	const isInitialMount = useRef(true)

	useEffect(() => {
		// Wait for authentication status to be determined
		if (status === 'loading') return

		// Skip redirect on initial mount if requested
		if (skipInitialRedirect && isInitialMount.current) {
			isInitialMount.current = false
			return
		}

		if (requireAuth && status === 'unauthenticated') {
			// Redirect to login if authentication is required but user is not authenticated
			router.replace('/onboarding')
		} else if (redirectAuthenticatedTo && status === 'authenticated') {
			// Redirect authenticated users if specified
			router.replace(redirectAuthenticatedTo)
		}

		// After first render, we're no longer on initial mount
		isInitialMount.current = false
	}, [status, requireAuth, redirectAuthenticatedTo, router, skipInitialRedirect])

	return {status}
}
