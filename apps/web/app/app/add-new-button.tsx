'use client'

import {Upload} from 'lucide-react'
import {TextScramble} from '@halycron/ui/components/text-scramble'
import {Button} from '@halycron/ui/components/button'
import {useState} from 'react'

export const AddNewButton = () => {
	const [primaryHover, setPrimaryHover] = useState(false)

	return (
		<Button className="uppercase w-36 justify-between" onMouseEnter={() => setPrimaryHover(true)} onMouseLeave={() => setPrimaryHover(false)}>
			<Upload className="size-4" />
			<TextScramble
				speed={0.05}
				trigger={primaryHover}
			>
				// Add new
			</TextScramble>
		</Button>
	)
}
