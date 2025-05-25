import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'
import {cn} from '@halycron/ui/lib/utils'
import Link from 'next/link'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {Button} from '@halycron/ui/components/button'
import {Suspense} from 'react'

export const SiteNav = async ({className}: { className?: string }) => {
	return (
		<header
			className={cn('absolute mx-auto px-8 lg:px-20 max-w-[1400px] py-6 top-0 inset-x-0 flex justify-between items-center z-10', className)}>
			<Link prefetch={true} href="/"><Image src={logo} alt="Halycron Logo" className="w-28"/></Link>

			<nav className="flex items-center gap-4">
				<Link prefetch={true} href="/about">About</Link>

				<Suspense fallback={null}>
					<AuthLinks/>
				</Suspense>
			</nav>
		</header>
	)
}

const AuthLinks = async () => {
	const session = await auth.api.getSession({
		headers: await headers()
	})

	return (
		<>
			{!session ? <Link prefetch={true} href="/login">Log in</Link> :
				<Link href="/api/auth/logout">Log out</Link>}

			{!session ? <Link prefetch={true} href="/register"><Button size="sm">Get started</Button></Link> :
				<Link prefetch={true} href="/app"><Button size="sm">Dashboard</Button></Link>}
		</>
	)
}
