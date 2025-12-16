'use client'

import * as React from 'react'

import {Button, type ButtonProps} from '@halycron/ui/components/button'
import {Popover, PopoverContent, PopoverTrigger} from '@halycron/ui/components/popover'
import {cn} from '@halycron/ui/lib/utils'

type PopConfirmProps = {
	children: React.ReactElement
	onConfirm: () => void | Promise<void>
	onCancel?: () => void
	disabled?: boolean

	title?: React.ReactNode
	description?: React.ReactNode

	confirmText?: string
	cancelText?: string

	confirmVariant?: ButtonProps['variant']
	cancelVariant?: ButtonProps['variant']

	contentClassName?: string
	align?: React.ComponentProps<typeof PopoverContent>['align']
	sideOffset?: React.ComponentProps<typeof PopoverContent>['sideOffset']
}

export function PopConfirm({
	children,
	onConfirm,
	onCancel,
	disabled,
	title = 'Are you sure?',
	description,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	confirmVariant = 'destructive',
	cancelVariant = 'outline',
	contentClassName,
	align = 'end',
	sideOffset = 8
}: PopConfirmProps) {
	const [open, setOpen] = React.useState(false)
	const [confirming, setConfirming] = React.useState(false)

	if (disabled) return children

	const handleConfirm = async () => {
		if (confirming) return
		try {
			setConfirming(true)
			await onConfirm()
			setOpen(false)
		} finally {
			setConfirming(false)
		}
	}

	const handleCancel = () => {
		onCancel?.()
		setOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				align={align}
				sideOffset={sideOffset}
				className={cn('w-72 p-3', contentClassName)}
			>
				<div className="space-y-1">
					<div className="text-sm font-medium leading-none">{title}</div>
					{description ? (
						<div className="text-xs text-muted-foreground leading-snug">{description}</div>
					) : null}
				</div>
				<div className="mt-3 flex justify-end gap-2">
					<Button
						type="button"
						variant={cancelVariant}
						size="sm"
						onClick={handleCancel}
						disabled={confirming}
					>
						{cancelText}
					</Button>
					<Button
						type="button"
						variant={confirmVariant}
						size="sm"
						onClick={handleConfirm}
						disabled={confirming}
					>
						{confirmText}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}


