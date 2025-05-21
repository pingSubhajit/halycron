import {cn} from '@/lib/utils'
import * as React from 'react'
import {TextInput, type TextInputProps} from 'react-native'

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, TextInputProps>(
	({className, placeholderClassName, ...props}, ref) => {
		return (
			<TextInput
				ref={ref}
				className={cn(
					'flex h-10 w-full border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
					props.editable === false && 'opacity-50 web:cursor-not-allowed',
					className
				)}
				placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
				{...props}
			/>
		)
	}
)

Input.displayName = 'Input'

export {Input}
