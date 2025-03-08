import {useState} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Button} from '@halycron/ui/components/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import Image from 'next/image'
import {authClient} from '@/lib/auth/auth-client'
import QRCode from 'qrcode'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {Input} from '@halycron/ui/components/input'
import {useEffect, useRef} from 'react'

const passwordFormSchema = z.object({
	password: z.string().min(1, 'Password is required')
})

const verificationFormSchema = z.object({
	code: z.string().length(6, 'Please enter a valid 6-digit code')
})

export const TwoFactorSetup = ({onComplete}: { onComplete: () => void }) => {
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [step, setStep] = useState<'password' | 'qr' | 'verify'>('password')
	const containerRef = useRef<HTMLDivElement>(null);

	const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
		resolver: zodResolver(passwordFormSchema),
		defaultValues: {
			password: ''
		}
	})

	const verificationForm = useForm<z.infer<typeof verificationFormSchema>>({
		resolver: zodResolver(verificationFormSchema),
		defaultValues: {
			code: ''
		}
	})

	useEffect(() => {
		if (step === 'verify') {
			// Focus the first input element inside the OTP container
			const focusInput = () => {
				const input = containerRef.current?.querySelector('input');
				if (input) {
					input.focus();
				}
			};

			// Try focusing immediately and also after a short delay
			focusInput();
			const timer = setTimeout(focusInput, 100);
			
			return () => clearTimeout(timer);
		}
	}, [step]);

	const initiate2FA = async (values: z.infer<typeof passwordFormSchema>) => {
		try {
			setIsLoading(true)
			setError('')
			const response = await authClient.twoFactor.enable({
				password: values.password
			})

			if (!response.data) {
				throw new Error('Failed to initialize 2FA setup')
			}

			const {totpURI, backupCodes} = await response.data

			// Generate QR code from totpURI
			const qrCode = await QRCode.toDataURL(totpURI)
			setQrCodeDataUrl(qrCode)
			setBackupCodes(backupCodes)
			setStep('qr')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to initialize 2FA setup')
		} finally {
			setIsLoading(false)
		}
	}

	const verify2FA = async (values: z.infer<typeof verificationFormSchema>) => {
		try {
			setIsLoading(true)
			setError('')
			const response = await authClient.twoFactor.verifyTotp({
				code: values.code
			})

			if (response.error) {
				throw new Error('Invalid verification code')
			}

			onComplete()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Invalid verification code')
			verificationForm.reset()
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="text-xl">Set Up Two-Factor Authentication</CardTitle>
				<CardDescription>
					Secure your account with two-factor authentication
				</CardDescription>
			</CardHeader>
			<CardContent>
				{step === 'password' && (
					<Form {...passwordForm}>
						<form onSubmit={passwordForm.handleSubmit(initiate2FA)} className="space-y-4">
							<p className="text-sm text-gray-500">
								Please enter your password to begin 2FA setup
							</p>
							<FormField
								control={passwordForm.control}
								name="password"
								render={({field}) => (
									<FormItem>
										<FormControl>
											<Input
												type="password"
												placeholder="Enter your password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{error && (
								<p className="text-sm text-red-500">{error}</p>
							)}
							<Button
								type="submit"
								disabled={isLoading || !passwordForm.formState.isValid}
								className="w-full"
							>
								Continue
							</Button>
						</form>
					</Form>
				)}

				{step === 'qr' && (
					<div className="space-y-6">
						<div className="space-y-2">
							<p className="text-sm text-gray-500">
								1. Install an authenticator app like Google Authenticator or Authy
							</p>
							<p className="text-sm text-gray-500">
								2. Scan this QR code with your authenticator app
							</p>
							<div className="flex justify-center">
								<Image
									src={qrCodeDataUrl}
									alt="QR Code"
									width={200}
									height={200}
									className="border p-2 rounded"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Backup Codes</p>
							<p className="text-sm text-gray-500">
								Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
							</p>
							<div className="bg-dark border border-zinc-800 p-4 rounded-md">
								<div className="grid grid-cols-2 gap-2">
									{backupCodes.map((code, index) => (
										<code key={index} className="text-sm font-mono">{code}</code>
									))}
								</div>
							</div>
						</div>

						<Button
							onClick={() => setStep('verify')}
							className="w-full"
						>
							Continue to Verification
						</Button>
					</div>
				)}

				{step === 'verify' && (
					<Form {...verificationForm}>
						<form onSubmit={verificationForm.handleSubmit(verify2FA)} className="space-y-4">
							<p className="text-sm text-gray-500">
								Enter the verification code from your authenticator app
							</p>
							<FormField
								control={verificationForm.control}
								name="code"
								render={({field}) => (
									<FormItem>
										<FormControl>
											<div ref={containerRef}>
												<InputOTP
													maxLength={6}
													value={field.value}
													onChange={field.onChange}
													autoFocus
												>
													<InputOTPGroup className="w-full justify-between">
														<InputOTPSlot index={0} className="w-12 h-12" />
														<InputOTPSlot index={1} className="w-12 h-12" />
														<InputOTPSlot index={2} className="w-12 h-12" />
														<InputOTPSlot index={3} className="w-12 h-12" />
														<InputOTPSlot index={4} className="w-12 h-12" />
														<InputOTPSlot index={5} className="w-12 h-12" />
													</InputOTPGroup>
												</InputOTP>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{error && (
								<p className="text-sm text-red-500">{error}</p>
							)}
							<Button
								type="submit"
								disabled={isLoading || !verificationForm.formState.isValid}
								className="w-full"
							>
								Verify and Enable 2FA
							</Button>
						</form>
					</Form>
				)}
			</CardContent>
		</Card>
	)
}
