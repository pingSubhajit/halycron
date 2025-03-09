'use client'

import {useState, useEffect} from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@halycron/ui/components/dialog'
import {Button} from '@halycron/ui/components/button'
import {api} from '@/lib/data/api-client'
import {toast} from 'sonner'
import {Lock, AlertCircle, KeyRound} from 'lucide-react'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {VerifyPinResponse} from '@/lib/data/api-client'

interface PinVerificationDialogProps {
	albumId: string
	isOpen: boolean
	onClose: () => void
	onVerified: () => void
}

export function PinVerificationDialog({
	albumId,
	isOpen,
	onClose,
	onVerified
}: PinVerificationDialogProps) {
	const [pin, setPin] = useState('')
	const [isVerifying, setIsVerifying] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [attempts, setAttempts] = useState(0)

	// Reset PIN when dialog opens
	useEffect(() => {
		if (isOpen) {
			setPin('')
			setError(null)
			setAttempts(0)
		}
	}, [isOpen])

	const handleVerify = async () => {
		if (pin.length !== 4) {
			setError('Please enter a 4-digit PIN')
			return
		}

		setIsVerifying(true)
		setError(null)

		try {
			// Call API to verify PIN
			const response = await api.post<VerifyPinResponse>(
				`/api/albums/${albumId}/verify-pin`, 
				{ pin }
			)
			
			// Check verification status
			if (response && response.verified === true) {
				// Success! Close dialog and notify parent
				toast.success('Album unlocked successfully')
				
				// Important: First close dialog, then notify parent with a slight delay
				// This prevents the "Invalid PIN" message from flickering
				onClose()
				setTimeout(() => {
					onVerified()
				}, 150)
				return
			}
			
			// If we get here but verification isn't true, it's an unexpected response
			setError('Verification failed. Please try again.')
			setPin('')
			setAttempts(prev => prev + 1)
		} catch (err: any) {
			// Extract error message from response if available
			const errorMessage = err.response?.data?.error || 'Invalid PIN. Please try again.'
			setError(errorMessage)
			setPin('')
			setAttempts(prev => prev + 1)
			
			// If too many failed attempts, show a stronger message
			if (attempts >= 4) {
				toast.error('Too many incorrect attempts. Please try again later.')
			}
		} finally {
			setIsVerifying(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-center gap-2">
						<Lock className="h-5 w-5" />
						Protected Album
					</DialogTitle>
					<DialogDescription className="text-center">
						This album is protected. Please enter the 4-digit PIN to access it.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center justify-center gap-6 py-4">
					<div className="relative">
						<InputOTP maxLength={4} value={pin} onChange={setPin}>
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
								<InputOTPSlot index={3} />
							</InputOTPGroup>
						</InputOTP>
						
						{attempts > 2 && (
							<div className="absolute -right-8 top-1/2 -translate-y-1/2 text-amber-500">
								<KeyRound className="h-5 w-5" />
							</div>
						)}
					</div>

					{error && (
						<div className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-4 w-4" />
							<p className="text-sm">{error}</p>
						</div>
					)}

					<Button
						onClick={handleVerify}
						disabled={pin.length !== 4 || isVerifying}
						className="w-full"
					>
						{isVerifying ? 'Verifying...' : 'Unlock Album'}
					</Button>

					{attempts > 3 && (
						<p className="text-xs text-muted-foreground text-center">
							Multiple incorrect attempts may lead to temporary lockout.
							Please make sure you're entering the correct PIN.
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}