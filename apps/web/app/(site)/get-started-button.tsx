'use client'

import {TextScramble} from '@halycron/ui/components/text-scramble'
import {useState} from 'react'
import Link from 'next/link'
import {Button} from '@halycron/ui/components/button'

export const GetStartedButton = ({className}: {className?: string}) => {
	const [primaryHover, setPrimaryHover] = useState(false)

	return (
		<Link prefetch={true} href="/app" onMouseEnter={() => setPrimaryHover(true)}
			onMouseLeave={() => setPrimaryHover(false)} className={className}>
			<Button className="w-40">
				<TextScramble
					speed={0.05}
					trigger={primaryHover}
					className="text-sm font-semibold uppercase text-primary"
				>
					Get Started
				</TextScramble>
			</Button>
		</Link>
	)
}
