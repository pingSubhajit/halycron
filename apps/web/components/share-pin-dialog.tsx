'use client'

import {useState, useRef, useEffect} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@halycron/ui/components/dialog'
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
			toast.error('Please enter a 4-digit PIN')
			return
		}

		verifyPin(
			{token, pin},
			{
				onSuccess: (data) => {
					if (data.isValid) {
						toast.success('PIN verified successfully')
						onPinVerified()
						onOpenChange(false)
					} else {
						toast.error('Invalid PIN. Please try again.')
						setPin('')
					}
				},
				onError: (error) => {
					toast.error(`Failed to verify PIN: ${error.message}`)
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
						PIN Protected Content
					</DialogTitle>
					<DialogDescription>
						This content is protected with a 4-digit PIN. Please enter the PIN to view the shared content.
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
						{isPending ? 'Verifying...' : 'Verify PIN'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
