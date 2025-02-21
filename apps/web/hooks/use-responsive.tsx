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
	const [hasMounted, setHasMounted] = useState(false)

	useEffect(() => {
		setHasMounted(true)
	}, [])

	useEffect(() => {
		if (!hasMounted) return

		const handleResize = () => {
			setWidth(window.innerWidth)
		}

		// Set initial width
		handleResize()

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [hasMounted])

	// Return 0 during SSR, actual width after mounting
	return width
}

export default useResponsive
