import {ReactNode} from 'react'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'

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
		<div className="relative">
			{/* <SiteNav />*/}
			<main>{children}</main>
		</div>
	)
}

export default SiteLayout
