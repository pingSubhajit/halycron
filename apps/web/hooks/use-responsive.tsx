import {useEffect, useState} from 'react'

export const breakpoints = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536
}

const useResponsive = () => {
	const [width, setWidth] = useState(0)

	useEffect(() => {
		// Initialize on mount
		setWidth(window.innerWidth)

		const handleResize = () => {
			setWidth(window.innerWidth)
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return width
}

export default useResponsive
