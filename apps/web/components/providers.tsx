'use client'

import * as React from 'react'
import {ThemeProvider as NextThemesProvider} from 'next-themes'
import {Toaster} from '@halycon/ui/components/sonner'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import APIProvider from '@/components/api-provider'
import {LightboxProvider} from './lightbox-context'

export const Providers = ({children}: { children: React.ReactNode }) => (
	<NextThemesProvider
		attribute="class"
		defaultTheme="dark"
		enableSystem
		disableTransitionOnChange
		enableColorScheme
	>
		<NuqsAdapter>
			<APIProvider>
				<LightboxProvider>
					{/* <ActivityTracker />*/}
					{children}
					<Toaster />
				</LightboxProvider>
			</APIProvider>
		</NuqsAdapter>
	</NextThemesProvider>
)
