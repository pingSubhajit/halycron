import {twMerge} from 'tailwind-merge'
import {type ClassValue, clsx} from 'clsx'

/**
 * Merge multiple class names with tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
