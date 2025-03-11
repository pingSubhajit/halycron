'use client'

import {useEffect, useState} from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@halycron/ui/components/dialog'
import {Button} from '@halycron/ui/components/button'
import {api} from '@/lib/data/api-client'
import {toast} from 'sonner'
import {Lock, AlertCircle, KeyRound} from 'lucide-react'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {VerifyPinResponse} from '@/lib/data/api-client'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'

const formSchema = z.object({
	pin: z.string().length(4, 'Please enter a 4-digit PIN')
})

interface PinVerificationDialogProps {
	albumId: string
	isOpen: boolean
	onClose: () => void
	onVerified: () => void
}

export const PinVerificationDialog = ({
	albumId,
	isOpen,
	onClose,
	onVerified
}: PinVerificationDialogProps) => {
	const [attempts, setAttempts] = useState(0)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			pin: ''
		}
	})

	const isVerifying = form.formState.isSubmitting

	// Reset form when dialog opens
	useEffect(() => {
		if (isOpen) {
			form.reset()
			setAttempts(0)
		}
	}, [isOpen, form])

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			// Call API to verify PIN
			const response = await api.post<VerifyPinResponse>(
				`/api/albums/${albumId}/verify-pin`,
				{pin: values.pin}
			)

			// Check verification status
			if (response && response.verified === true) {
				// Success! Close dialog and notify parent
				toast.success('Album unlocked successfully')

				/*
				 * Important: First close dialog, then notify parent with a slight delay
				 * This prevents the "Invalid PIN" message from flickering
				 */
				onClose()
				setTimeout(() => {
					onVerified()
				}, 150)
				return
			}

			// If we get here but verification isn't true, it's an unexpected response
			form.setError('pin', {
				type: 'manual',
				message: 'Verification failed. Please try again.'
			})
			form.reset({pin: ''})
			setAttempts(prev => prev + 1)
		} catch (err: any) {
			// Extract error message from response if available
			const errorMessage = err.response?.data?.error || 'Invalid PIN. Please try again.'
			form.setError('pin', {
				type: 'manual',
				message: errorMessage
			})
			form.reset({pin: ''})
			setAttempts(prev => prev + 1)

			// If too many failed attempts, show a stronger message
			if (attempts >= 4) {
				toast.error('Too many incorrect attempts. Please try again later.')
			}
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
						This album is protected. Please enter your PIN to access it.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center justify-center gap-6 py-4">
						<div className="relative w-full">
							<FormField
								control={form.control}
								name="pin"
								render={({field}) => (
									<FormItem className="w-full">
										<FormControl>
											<InputOTP maxLength={4} {...field} className="w-full">
												<InputOTPGroup className="w-full">
													<InputOTPSlot index={0} className="w-full h-16" />
													<InputOTPSlot index={1} className="w-full h-16" />
													<InputOTPSlot index={2} className="w-full h-16" />
													<InputOTPSlot index={3} className="w-full h-16" />
												</InputOTPGroup>
											</InputOTP>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{attempts > 2 && (
								<div className="absolute -right-8 top-1/2 -translate-y-1/2 text-amber-500">
									<KeyRound className="h-5 w-5" />
								</div>
							)}
						</div>

						<Button
							type="submit"
							disabled={!form.formState.isValid || isVerifying}
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
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
