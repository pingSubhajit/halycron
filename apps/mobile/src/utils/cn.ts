import {twMerge} from 'tailwind-merge'
import {clsx, type ClassValue} from 'clsx'

/**
 * Merge multiple class names with tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
