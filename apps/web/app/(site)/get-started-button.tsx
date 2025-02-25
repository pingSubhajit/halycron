'use client'

import {TextScramble} from '@halycon/ui/components/text-scramble'
import {useState} from 'react'
import Link from 'next/link'

export const GetStartedButton = ({className}: {className?: string}) => {
	const [primaryHover, setPrimaryHover] = useState(false)

	return (
		<Link href="/app" onMouseEnter={() => setPrimaryHover(true)} onMouseLeave={() => setPrimaryHover(false)} className={className}>
			<TextScramble
				speed={0.05}
				trigger={primaryHover}
				className="text-sm font-semibold uppercase underline underline-offset-8"
			>
				Get Started
			</TextScramble>
		</Link>
	)
}
