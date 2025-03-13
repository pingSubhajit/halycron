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
import {AnimatePresence, motion, LayoutGroup} from 'motion/react'

const passwordFormSchema = z.object({
	password: z.string().min(1, 'We\'ll need your password to get started')
})

const verificationFormSchema = z.object({
	code: z.string().length(6, 'Looking for a 6-digit code from your authenticator app')
})

export const TwoFactorSetup = ({onComplete}: { onComplete: () => void }) => {
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [step, setStep] = useState<'password' | 'qr' | 'verify'>('password')
	const containerRef = useRef<HTMLDivElement>(null)

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
				const input = containerRef.current?.querySelector('input')
				if (input) {
					input.focus()
				}
			}

			// Try focusing immediately and also after a short delay
			focusInput()
			const timer = setTimeout(focusInput, 100)

			return () => clearTimeout(timer)
		}
	}, [step])

	const initiate2FA = async (values: z.infer<typeof passwordFormSchema>) => {
		try {
			setIsLoading(true)
			setError('')
			const response = await authClient.twoFactor.enable({
				password: values.password
			})

			if (!response.data) {
				throw new Error('We couldn\'t set up 2FA right now. Let\'s try again?')
			}

			const {totpURI, backupCodes} = await response.data

			// Generate QR code from totpURI
			const qrCode = await QRCode.toDataURL(totpURI)
			setQrCodeDataUrl(qrCode)
			setBackupCodes(backupCodes)
			setStep('qr')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something didn\'t work right. Let\'s try again?')
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
				throw new Error('That code doesn\'t seem right. Let\'s try again?')
			}

			onComplete()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'That code didn\'t work. Another try?')
			verificationForm.reset()
		} finally {
			setIsLoading(false)
		}
	}

	// Shared spring transition for all layout animations
	const springTransition = {
		type: 'spring',
		stiffness: 250,
		damping: 25,
		mass: 1
	}

	// Fade transition for content switches
	const fadeTransition = {
		duration: 0.2
	}

	return (
		<LayoutGroup id="two-factor-setup-layout">
			<Card className="w-full max-w-md mx-auto">
				<motion.div layout="position" layoutId="2fa-header" transition={springTransition}>
					<CardHeader>
						<CardTitle className="text-center">
							{step === 'password' && 'Let\'s Add an Extra Layer of Security'}
							{step === 'qr' && 'Scan This QR Code'}
							{step === 'verify' && 'Verify Your Authenticator App'}
						</CardTitle>
						<CardDescription className="text-center">
							{step === 'password' && 'Your memories deserve the best protection—it only takes a minute'}
							{step === 'qr' && 'Use an authenticator app to scan this QR code'}
							{step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
						</CardDescription>
					</CardHeader>
				</motion.div>

				<motion.div layout="position" layoutId="2fa-content" transition={springTransition}>
					<CardContent>
						<AnimatePresence mode="wait" initial={false}>
							{step === 'password' && (
								<motion.div
									key="password-step"
									initial={{opacity: 0}}
									animate={{opacity: 1}}
									exit={{opacity: 0}}
									transition={fadeTransition}
								>
									<Form {...passwordForm}>
										<form onSubmit={passwordForm.handleSubmit(initiate2FA)} className="space-y-4">
											<p className="text-sm text-gray-500">
												First, we'll need your password to get started
											</p>
											<FormField
												control={passwordForm.control}
												name="password"
												render={({field}) => (
													<FormItem>
														<FormControl>
															<Input
																type="password"
																placeholder="Your password"
																{...field}
															/>
														</FormControl>
														<FormMessage/>
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
												{isLoading ? 'Just a moment...' : 'Let\'s continue'}
											</Button>
										</form>
									</Form>
								</motion.div>
							)}

							{step === 'qr' && (
								<motion.div
									key="qr-step"
									initial={{opacity: 0}}
									animate={{opacity: 1}}
									exit={{opacity: 0}}
									transition={fadeTransition}
								>
									<div className="space-y-6">
										<div className="space-y-2">
											<p className="text-sm text-gray-500">
												1. Grab your favorite authenticator app (like Google Authenticator or
												Authy)
											</p>
											<p className="text-sm text-gray-500">
												2. Scan this QR code to add Halycron to your app
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
											<p className="text-sm font-medium">Your Safety Net: Backup Codes</p>
											<p className="text-sm text-gray-500">
												Keep these backup codes somewhere safe — they're your way back in if you
												ever lose your phone. Think of them as spare keys.
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
											I've saved my backup codes
										</Button>
									</div>
								</motion.div>
							)}

							{step === 'verify' && (
								<motion.div
									key="verify-step"
									initial={{opacity: 0}}
									animate={{opacity: 1}}
									exit={{opacity: 0}}
									transition={fadeTransition}
								>
									<Form {...verificationForm}>
										<form onSubmit={verificationForm.handleSubmit(verify2FA)} className="space-y-4">
											<p className="text-sm text-gray-500">
												Now, enter the 6-digit code from your authenticator app
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
																	<InputOTPGroup className="w-full justify-center">
																		<InputOTPSlot index={0}
																			className="w-full h-14"/>
																		<InputOTPSlot index={1}
																			className="w-full h-14"/>
																		<InputOTPSlot index={2}
																			className="w-full h-14"/>
																		<InputOTPSlot index={3}
																			className="w-full h-14"/>
																		<InputOTPSlot index={4}
																			className="w-full h-14"/>
																		<InputOTPSlot index={5}
																			className="w-full h-14"/>
																	</InputOTPGroup>
																</InputOTP>
															</div>
														</FormControl>
														<FormMessage/>
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
												{isLoading ? 'Checking...' : 'Finish Setup'}
											</Button>
										</form>
									</Form>
								</motion.div>
							)}
						</AnimatePresence>
					</CardContent>
				</motion.div>
			</Card>
		</LayoutGroup>
	)
}
