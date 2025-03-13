'use client'

import {useEffect, useRef, useState} from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@halycron/ui/components/dialog'
import {Button} from '@halycron/ui/components/button'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {Label} from '@halycron/ui/components/label'
import {useVerifyPin} from '@/app/api/shared/mutations'
import {toast} from 'sonner'
import {LockIcon} from 'lucide-react'

interface SharePinDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	token: string
	onPinVerified: () => void
}

export function SharePinDialog({
	open,
	onOpenChange,
	token,
	onPinVerified
}: SharePinDialogProps) {
	const [pin, setPin] = useState<string>('')
	const {mutate: verifyPin, isPending} = useVerifyPin()
	const pinInputRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (open) {
			setTimeout(() => {
				const input = pinInputRef.current?.querySelector('input')
				if (input) {
					input.focus()
				}
			}, 100)
		}
	}, [open])

	const handleVerifyPin = () => {
		// Validate PIN
		if (!pin || pin.length !== 4) {
			toast.error('Just need that 4-digit PIN to unlock this content')
			return
		}

		verifyPin(
			{token, pin},
			{
				onSuccess: (data) => {
					if (data.isValid) {
						onPinVerified()
						onOpenChange(false)
					} else {
						toast.error('Hmm, that PIN didn\'t work. Want to try again?')
						setPin('')
					}
				},
				onError: (error) => {
					toast.error(`We had trouble checking your PIN: ${error.message}`)
				}
			}
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LockIcon className="h-5 w-5" />
						Just One More Step
					</DialogTitle>
					<DialogDescription>
						This content is protected with a PIN. Enter the 4-digit code you received to view the shared
						photos.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="pin-input" className="sr-only">4-Digit PIN</Label>
						<div ref={pinInputRef}>
							<InputOTP
								maxLength={4}
								value={pin}
								onChange={setPin}
								onComplete={handleVerifyPin}
							>
								<InputOTPGroup className=" w-full justify-center">
									<InputOTPSlot index={0} className="w-full h-16" />
									<InputOTPSlot index={1} className="w-full h-16" />
									<InputOTPSlot index={2} className="w-full h-16" />
									<InputOTPSlot index={3} className="w-full h-16" />
								</InputOTPGroup>
							</InputOTP>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						onClick={handleVerifyPin}
						disabled={isPending || pin.length !== 4}
						className="w-full"
					>
						{isPending ? 'Checking...' : 'Unlock Content'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
