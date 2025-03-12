import {ReactNode} from 'react'
import {SmoothScroll} from '@/components/smooth-scroll'
import {SiteNav} from '@/components/site-nav'

const SiteLayout = async ({children}: {children: ReactNode}) => {
	return (
		<SmoothScroll>
			<div className="relative">
				<SiteNav/>
				<main>{children}</main>
			</div>
		</SmoothScroll>
	)
}

export default SiteLayout
