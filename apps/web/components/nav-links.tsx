'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@halycron/ui/lib/utils'

export const NavLinks = () => {
	const pathname = usePathname()

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
