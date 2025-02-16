import {useEffect, useState} from 'react'

export const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024)
		}

		checkMobile()
		window.addEventListener('resize', checkMobile)

		return () => {
			window.removeEventListener('resize', checkMobile)
		}
	}, [])

	return isMobile
}
