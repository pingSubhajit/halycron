import {Geist, Geist_Mono} from 'next/font/google'

import '@halycon/ui/globals.css'
import {Providers} from '@/components/providers'

const fontSans = Geist({
	subsets: ['latin'],
	variable: '--font-sans'
})

const fontMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-mono'
})

const RootLayout = ({
	children
}: Readonly<{
  children: React.ReactNode
}>) => (
	<html lang="en" suppressHydrationWarning>
		<body
			className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
		>
			<Providers>{children}</Providers>
		</body>
	</html>
)

export default RootLayout
