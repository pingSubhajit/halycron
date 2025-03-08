import {ReactNode} from 'react'
import {UserMenu} from '@/components/user-menu'
import {AddNewButton} from '@/app/app/add-new-button'
import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'
import Link from 'next/link'

const DashboardLayout = ({children}: {children: ReactNode}) => {
	return (
		<div className="w-full bg-background">
			<header className="px-4 py-2 border-b border-dashed flex items-center justify-between sticky top-0 z-10 bg-background">
				<div className="flex items-center gap-8">
					<Link href="/app"><Image src={logo} alt="Halycron Logo" className="w-32" /></Link>

					<div className="flex items-center mt-2 gap-3">
						<Link href="/app">Gallery</Link>
						<Link href="/app/albums">Albums</Link>
					</div>
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
