import {ReactNode} from 'react'
import {SiteNav} from '@/components/site-nav'

const SiteLayout = ({children}: {children: ReactNode}) => {
	return (
		<div className="relative">
			<SiteNav />
			<main>{children}</main>
		</div>
	)
}

export default SiteLayout
