import {useEffect, useRef} from 'react'

export function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): T {
	const timeoutRef = useRef<NodeJS.Timeout>(null)
	const callbackRef = useRef(callback)

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	return ((...args: Parameters<T>) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		timeoutRef.current = setTimeout(() => {
			callbackRef.current(...args)
		}, delay)
	}) as T
} 