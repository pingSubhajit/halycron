'use client'

import * as React from 'react'
import {ThemeProvider as NextThemesProvider} from 'next-themes'
import {Toaster} from '@halycon/ui/components/sonner'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {ActivityTracker} from './activity-tracker'

export const Providers = ({children}: { children: React.ReactNode }) => (
	<NextThemesProvider
		attribute="class"
		defaultTheme="dark"
		enableSystem
		disableTransitionOnChange
		enableColorScheme
	>
		<NuqsAdapter>
			<ActivityTracker />
			{children}
			<Toaster />
		</NuqsAdapter>
	</NextThemesProvider>
)
