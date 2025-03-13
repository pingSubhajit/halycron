'use client'

import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {cn} from '@halycron/ui/lib/utils'
import {useHotkeys} from 'react-hotkeys-hook'

export const NavLinks = () => {
	const pathname = usePathname()
	const router = useRouter()

	useHotkeys('g', () => pathname !== '/app' && router.push('/app'), [pathname])
	useHotkeys('a', () => pathname !== '/app/albums' && router.push('/app/albums'), [pathname])

	return (
		<div className="flex items-center mt-2 gap-3">
			<Link
				href="/app"
				className={cn(
					'transition-colors hover:text-primary',
					pathname === '/app' && 'text-primary font-medium'
				)}
			>
				Gallery
			</Link>
			<Link
				href="/app/albums"
				className={cn(
					'transition-colors hover:text-primary',
					pathname === '/app/albums' && 'text-primary font-medium'
				)}
			>
				Albums
			</Link>
		</div>
	)
}
