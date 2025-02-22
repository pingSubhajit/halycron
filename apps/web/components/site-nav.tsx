import Image from 'next/image'
import logo from '@halycon/ui/media/logo.svg'
import {cn} from '@halycon/ui/lib/utils'
import {Button} from '@halycon/ui/components/button'
import Link from 'next/link'

export const SiteNav = ({className}: {className?: string}) => {
	return (
		<header className={cn('absolute w-screen px-8 lg:px-20 py-6 top-0 inset-x-0 flex justify-between items-center z-10', className)}>
			<Link href="/"><Image src={logo} alt="Halycron Logo" className="w-32"/></Link>

			<Link href="/app"><Button size="sm">Dashboard</Button></Link>
		</header>
	)
}
