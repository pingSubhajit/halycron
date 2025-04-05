import {ReactNode} from 'react'
import {UserMenu} from '@/components/user-menu'
import {AddNewButton} from '@/app/app/add-new-button'
import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'
import Link from 'next/link'
import {NavLinks} from '@/components/nav-links'

const DashboardLayout = ({children}: {children: ReactNode}) => {
	return (
		<div className="w-full bg-background">
			<header className="px-4 py-2 border-b border-dashed flex items-center justify-between sticky top-0 z-20 bg-background">
				<div className="flex items-center gap-8">
					<Link prefetch={true} href="/app"><Image src={logo} alt="Halycron Logo" className="w-32"/></Link>
					<NavLinks/>
				</div>

				<div className="flex items-center gap-1.5">
					<AddNewButton />
					<UserMenu />
				</div>
			</header>

			<main className="p-4">
				{children}
			</main>
		</div>
	)
}

export default DashboardLayout
