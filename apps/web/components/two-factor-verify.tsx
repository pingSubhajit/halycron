import {useEffect, useRef, useState} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Button} from '@halycron/ui/components/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'

const formSchema = z.object({
	code: z.string().length(6, 'Please provide your 6-digit security code')
})

export const TwoFactorVerify = ({onVerify, onCancel}: { onVerify: (code: string) => Promise<void>, onCancel: () => void }) => {
	const [isLoading, setIsLoading] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			code: ''
		}
	})

	useEffect(() => {
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
	}, [])

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			setIsLoading(true)
			await onVerify(values.code)
		} catch (err) {
			form.setError('code', {
				message: err instanceof Error ? err.message : 'That code doesn\'t seem right. Let\'s try again?'
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="text-center">One Last Security Step</CardTitle>
				<CardDescription className="text-center">
					Enter the 6-digit code from your authenticator app to confirm it's you
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
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
													<InputOTPSlot index={0} className="w-full h-14" />
													<InputOTPSlot index={1} className="w-full h-14" />
													<InputOTPSlot index={2} className="w-full h-14" />
													<InputOTPSlot index={3} className="w-full h-14" />
													<InputOTPSlot index={4} className="w-full h-14" />
													<InputOTPSlot index={5} className="w-full h-14" />
												</InputOTPGroup>
											</InputOTP>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex space-x-2">
							<Button
								type="submit"
								disabled={isLoading || !form.formState.isValid}
								className="flex-1"
							>
								{isLoading ? 'Verifying...' : 'Let me in'}
							</Button>
							<Button
								type="button"
								onClick={onCancel}
								variant="outline"
								disabled={isLoading}
							>
								Go back
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}
