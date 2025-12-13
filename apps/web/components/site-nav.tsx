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
			className={cn('absolute mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 max-w-[1400px] py-4 sm:py-5 md:py-6 top-0 inset-x-0 flex justify-between items-center z-10', className)}>
			<Link prefetch={true} href="/"><Image src={logo} alt="Halycron Logo"
				className="w-20 sm:w-24 md:w-28"/></Link>

			<nav className="flex items-center gap-2 sm:gap-3 md:gap-4">
				<Link prefetch={true} href="/about"
					className="text-sm sm:text-base hover:opacity-70 transition-opacity">About</Link>

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
		<div className="flex items-center gap-2 sm:gap-3 md:gap-4">
			{!session ? (
				<>
					<Link prefetch={true} href="/login"
						className="text-sm sm:text-base hover:opacity-70 transition-opacity">Log in</Link>
					<Link prefetch={true} href="/register">
						<Button size="sm" className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">Get
							started</Button>
					</Link>
				</>
			) : (
				<>
					<form action="/api/auth/logout" method="post">
						<button
							type="submit"
							className="text-sm sm:text-base hover:opacity-70 transition-opacity"
						>
							Log out
						</button>
					</form>
					<Link prefetch={true} href="/app">
						<Button size="sm" className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">Dashboard</Button>
					</Link>
				</>
			)}
		</div>
	)
}
