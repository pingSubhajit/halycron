'use client'

import {ReactLenis, useLenis} from 'lenis/react'
import {type PropsWithChildren} from 'react'

export const SmoothScroll = ({children}: PropsWithChildren) => {
	const lenis = useLenis(({scroll}) => {
		// called every scroll
	})

	return (
		<ReactLenis
			root
			options={{
				lerp: 0.1
			}}
		>
			{children}
		</ReactLenis>
	)
}
