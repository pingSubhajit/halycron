'use client'

import * as React from 'react'
import {ThemeProvider as NextThemesProvider} from 'next-themes'

export const Providers = ({children}: { children: React.ReactNode }) => (
	<NextThemesProvider
		attribute="class"
		defaultTheme="system"
		enableSystem
		disableTransitionOnChange
		enableColorScheme
	>
		{children}
	</NextThemesProvider>
)
