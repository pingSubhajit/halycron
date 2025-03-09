'use client'

import {useState} from 'react'
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
import {Lock, AlertCircle} from 'lucide-react'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'

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

	const handleVerify = async () => {
		if (pin.length !== 4) {
			setError('Please enter a 4-digit PIN')
			return
		}

		setIsVerifying(true)
		setError(null)

		try {
			const response = await api.post(`/api/albums/${albumId}/verify-pin`, { pin })
			if (response.verified) {
				toast.success('Album unlocked successfully')
				onVerified()
				onClose()
			}
		} catch (err) {
			setError('Invalid PIN. Please try again.')
			setPin('')
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
					<InputOTP maxLength={4} value={pin} onChange={setPin}>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
						</InputOTPGroup>
					</InputOTP>

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
				</div>
			</DialogContent>
		</Dialog>
	)
}