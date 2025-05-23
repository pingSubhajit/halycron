import React from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// React Native doesn't have window focus events like web browsers
			refetchOnWindowFocus: false,
			// Network state change refetching is more important on mobile
			refetchOnReconnect: true,
			// More conservative retry logic for mobile
			retry: 2,
			// Longer stale time for mobile to reduce unnecessary requests
			staleTime: 5 * 60 * 1000, // 5 minutes
		},
	},
})

type Props = {
	children: React.ReactNode
}

export const QueryProvider = ({children}: Props) => {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	)
} 