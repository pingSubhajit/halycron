import * as React from 'react'

import {cn} from '@halycron/ui/lib/utils'

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
	({className, ...props}, ref) => (
		<div
			ref={ref}
			className={cn(
				'flex w-full flex-col items-center justify-center gap-2 p-8 text-center animate-in fade-in-50',
				className
			)}
			{...props}
		/>
	)
)
Empty.displayName = 'Empty'

const EmptyHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({className, ...props}, ref) => (
		<div
			ref={ref}
			className={cn('flex max-w-md flex-col items-center justify-center gap-1', className)}
			{...props}
		/>
	)
)
EmptyHeader.displayName = 'EmptyHeader'

type EmptyMediaProps = React.HTMLAttributes<HTMLDivElement> & {
	variant?: 'default' | 'icon'
}

const EmptyMedia = React.forwardRef<HTMLDivElement, EmptyMediaProps>(
	({className, variant = 'default', ...props}, ref) => (
		<div
			ref={ref}
			className={cn(
				'mb-4',
				variant === 'icon'
					? 'flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground backdrop-blur-sm'
					: 'flex items-center justify-center',
				className
			)}
			{...props}
		/>
	)
)
EmptyMedia.displayName = 'EmptyMedia'

const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({className, ...props}, ref) => (
		<h2
			ref={ref}
			className={cn('text-lg font-semibold tracking-tight text-foreground', className)}
			{...props}
		/>
	)
)
EmptyTitle.displayName = 'EmptyTitle'

const EmptyDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({className, ...props}, ref) => (
		<p
			ref={ref}
			className={cn('text-sm text-muted-foreground text-pretty', className)}
			{...props}
		/>
	)
)
EmptyDescription.displayName = 'EmptyDescription'

const EmptyContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({className, ...props}, ref) => (
		<div ref={ref} className={cn('mt-6 flex flex-col items-center gap-2', className)} {...props} />
	)
)
EmptyContent.displayName = 'EmptyContent'

export {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyContent
}
