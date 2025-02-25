import {ReactNode} from 'react'

const SiteLayout = ({children}: {children: ReactNode}) => {
	return (
		<div className="relative">
			{/* <SiteNav />*/}
			<main>{children}</main>
		</div>
	)
}

export default SiteLayout
