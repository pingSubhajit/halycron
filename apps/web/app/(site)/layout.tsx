import {ReactNode} from 'react'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'
import {SmoothScroll} from '@/components/smooth-scroll'

const SiteLayout = async ({children}: {children: ReactNode}) => {
	// Check if user is logged in on the server
	const session = await auth.api.getSession({
		headers: await headers()
	})

	// If user is logged in, redirect to /app
	if (session) {
		redirect('/app')
	}

	return (
		<SmoothScroll>
			<div className="relative">
				{/* <SiteNav />*/}
				<main>{children}</main>
			</div>
		</SmoothScroll>
	)
}

export default SiteLayout
