'use client'

import {ChevronRight} from 'lucide-react'
import {TextScramble} from '@halycon/ui/components/text-scramble'
import {Button} from '@halycon/ui/components/button'
import {useState} from 'react'
import Link from 'next/link'

export const GetStartedButton = () => {
	const [primaryHover, setPrimaryHover] = useState(false)

	return (
		<Link href="/login">
			<Button className="uppercase w-full lg:w-[400px] justify-between font-grotesque" onMouseEnter={() => setPrimaryHover(true)} onMouseLeave={() => setPrimaryHover(false)}>
				<TextScramble
					speed={0.05}
					trigger={primaryHover}
				>
					// Get Started
				</TextScramble>

				<ChevronRight size={8} />
			</Button>
		</Link>
	)
}
