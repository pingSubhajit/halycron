'use client'

import * as React from 'react'
import {ThemeProvider as NextThemesProvider} from 'next-themes'
import {Toaster} from '@halycron/ui/components/sonner'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import APIProvider from '@/components/api-provider'
import {LightboxProvider} from './lightbox-context'
import {ActivityTracker} from '@/components/activity-tracker'
import {VaultProvider} from '@/components/vault-provider'

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
				<VaultProvider>
					<LightboxProvider>
						<ActivityTracker/>
						{children}
						<Toaster/>
					</LightboxProvider>
				</VaultProvider>
			</APIProvider>
		</NuqsAdapter>
	</NextThemesProvider>
)
