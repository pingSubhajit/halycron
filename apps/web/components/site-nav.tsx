import Image from 'next/image'
import logo from '@halycon/ui/media/logo.svg'
import {cn} from '@halycon/ui/lib/utils'
import Link from 'next/link'

export const SiteNav = ({className}: {className?: string}) => {
	return (
		<header className={cn('absolute mx-auto px-8 lg:px-20 max-w-[800px] py-6 top-0 inset-x-0 flex justify-center items-center z-10', className)}>
			<Link href="/"><Image src={logo} alt="Halycron Logo" className="w-32"/></Link>
		</header>
	)
}
