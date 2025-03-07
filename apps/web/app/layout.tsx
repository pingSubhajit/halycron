import {Geist, Geist_Mono} from 'next/font/google'
import localFont from 'next/font/local'

import '@halycron/ui/globals.css'
import {Providers} from '@/components/providers'
import {Metadata} from 'next'

const fontGrotesque = localFont({
	src: '../../../packages/ui/src/fonts/medium.otf',
	variable: '--font-grotesque',
	display: 'swap'
})

const fontSans = Geist({
	subsets: ['latin'],
	variable: '--font-sans'
})

const fontMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-mono'
})

export const metadata: Metadata = {
	metadataBase: new URL(process.env.BETTER_AUTH_URL),
	authors: [{name: 'Subhajit Kundu', url: 'https://subhajit.lol'}]
}

const RootLayout = ({
	children
}: Readonly<{
  children: React.ReactNode
}>) => (
	<html lang="en" suppressHydrationWarning>
		<body className={`${fontSans.variable} ${fontMono.variable} ${fontGrotesque.variable} font-sans antialiased`}>
			<Providers>{children}</Providers>
		</body>
	</html>
)

export default RootLayout
