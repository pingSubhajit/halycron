'use client'

import {useMemo, useState} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@halycron/ui/components/dialog'
import {Button} from '@halycron/ui/components/button'
import {KeyRound, Copy, Check, AlertTriangle} from 'lucide-react'
import {toast} from 'sonner'

type RecoveryKeyDialogProps = {
	open: boolean
	recoveryKey: string | null
	onConfirm: () => void
	title?: string
	description?: React.ReactNode
	primaryActionLabel?: string
	variant?: 'default' | 'warning'
}

export function RecoveryKeyDialog({
	open,
	recoveryKey,
	onConfirm,
	title = 'Save your Recovery Key',
	description = (
		<span>
			This key is the <span className="text-foreground font-medium">only way</span> to recover your encrypted photos if you forget your password.
		</span>
	),
	primaryActionLabel = 'I have saved this key',
	variant = 'default'
}: RecoveryKeyDialogProps) {
	const [copied, setCopied] = useState(false)

	const accent = useMemo(() => {
		if (variant === 'warning') {
			return {
				iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
				iconColor: 'text-amber-500',
				highlightText: 'text-amber-500'
			}
		}
		return {
			iconBg: 'bg-primary/10 text-primary',
			iconColor: 'text-primary',
			highlightText: 'text-foreground'
		}
	}, [variant])

	const handleCopy = async () => {
		if (!recoveryKey) return
		try {
			await navigator.clipboard.writeText(recoveryKey)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
			toast.success('Recovery key copied to clipboard')
		} catch (err) {
			console.error('Failed to copy recovery key', err)
			toast.error('Could not copy the recovery key. Please copy it manually.')
		}
	}

	return (
		<Dialog open={open} onOpenChange={() => {}}>
			<DialogContent
				className="sm:max-w-lg shadow-2xl"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<div className="flex flex-col items-center gap-4 pb-2">
						<div className={`h-12 w-12 rounded-full flex items-center justify-center ${accent.iconBg}`}>
							{variant === 'warning' ? (
								<AlertTriangle className="h-6 w-6 text-amber-500" />
							) : (
								<KeyRound className={`h-6 w-6 ${accent.iconColor}`} />
							)}
						</div>
						<div className="space-y-1 text-center">
							<DialogTitle className="text-xl">{title}</DialogTitle>
							<DialogDescription className="text-center">{description}</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 pt-2">
					<div className="relative">
						<div className="rounded-lg border border-border bg-muted/50 p-4 pr-12 font-mono text-sm break-all text-muted-foreground select-all text-center">
							{recoveryKey}
						</div>
						<Button
							size="icon"
							variant="ghost"
							className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							onClick={handleCopy}
							title="Copy to clipboard"
						>
							{copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
						</Button>
					</div>
				</div>

				<DialogFooter className="sm:justify-center pt-2">
					<Button
						type="button"
						className="w-full font-bold"
						size="lg"
						onClick={onConfirm}
					>
						{primaryActionLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

