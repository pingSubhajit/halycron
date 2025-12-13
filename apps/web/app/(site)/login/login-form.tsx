'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Eye, EyeOff, QrCode} from 'lucide-react'
import {Button} from '@halycron/ui/components/button'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import {Input} from '@halycron/ui/components/input'
import {authClient} from '@/lib/auth/auth-client'
import {toast} from 'sonner'
import {TwoFactorVerify} from '@/components/two-factor-verify'
import {QrLogin} from '@/components/qr-login'
import {AnimatePresence, LayoutGroup, motion} from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'

const formSchema = z.object({
	email: z.string().email('Hmm, that doesn\'t look like a valid email. Mind trying again?'),
	password: z.string().min(1, 'We\'ll need your password to get you in')
})

type LoginView = 'credentials' | 'two-factor' | 'qr-login' | 'forgot-password'

const LoginForm = () => {
	const router = useRouter()
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [loginView, setLoginView] = useState<LoginView>('credentials')
	const [forgotEmail, setForgotEmail] = useState('')
	const [forgotLoading, setForgotLoading] = useState(false)

	// Backwards compatibility helpers
	const showTwoFactorVerify = loginView === 'two-factor'
	const setShowTwoFactorVerify = (show: boolean) => setLoginView(show ? 'two-factor' : 'credentials')

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: ''
		}
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			setIsLoading(true)
			const {data, error} = await authClient.signIn.email({
				email: values.email,
				password: values.password
			})

			if (error || !data) {
				throw error || new Error('Failed to sign in')
			}

			// Check if 2FA is required
			const has2FA = (data as unknown as {twoFactorRedirect: boolean}).twoFactorRedirect

			// Check if this is a demo account
			const isDemoAccount = process.env.NEXT_PUBLIC_DEMO_ACCOUNT_EMAIL && values.email === process.env.NEXT_PUBLIC_DEMO_ACCOUNT_EMAIL

			if (has2FA) {
				setShowTwoFactorVerify(true)
			} else if (isDemoAccount) {
				// Demo accounts bypass two-factor setup and go directly to the app
				toast.success('Welcome to the demo!')
				window.location.href = '/app'
			} else {
				toast.success('One more step for extra safety! Let\'s set up two-factor authentication to keep your memories extra secure.')
				router.push('/register?twoFa=2fa')
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Hmm, those details didn\'t work. Want to try again?')
		} finally {
			setIsLoading(false)
		}
	}

	const handleRequestPasswordReset = async () => {
		try {
			setForgotLoading(true)

			const email = (forgotEmail || form.getValues('email') || '').trim()
			if (!email) {
				toast.error('Enter your email first, and we’ll send you a reset link.')
				return
			}

			const redirectTo = `${window.location.origin}/reset-password`
			const {error} = await authClient.requestPasswordReset({
				email,
				redirectTo
			} as never)

			if (error) {
				// Never enumerate accounts; just show a friendly confirmation.
				console.error('requestPasswordReset error:', error)
			}

			toast.success('If an account exists for that email, we just sent a reset link.')
			setLoginView('credentials')
		} catch (error) {
			console.error('requestPasswordReset failed:', error)
			toast.success('If an account exists for that email, we just sent a reset link.')
			setLoginView('credentials')
		} finally {
			setForgotLoading(false)
		}
	}

	const handleTwoFactorVerify = async (code: string) => {
		const response = await authClient.twoFactor.verifyTotp({
			code
		})

		if (response.error) {
			throw new Error('That code doesn\'t seem right. Let\'s try again?')
		}

		window.location.href = '/app'
	}

	// Shared spring transition for all layout animations
	const springTransition = {
		type: 'spring',
		stiffness: 250,
		damping: 25,
		mass: 1
	}

	return (
		<LayoutGroup id="login-form-layout">
			<div className="mx-auto w-full max-w-md space-y-6">
				<motion.div
					className="flex flex-col text-center items-center"
					layout="position"
					layoutId="header"
					transition={springTransition}
				>
					<Link prefetch={true} href="/"><Image src={logo} alt="Halycron Logo" className="w-32"/></Link>

					<h1 className="mt-8 text-2xl font-semibold tracking-tight">Welcome back</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Enter your credentials to sign in to your account
					</p>
				</motion.div>

				<motion.div
					layout="position"
					layoutId="content"
					transition={springTransition}
				>
					<AnimatePresence mode="wait" initial={false}>
						{loginView === 'two-factor' && (
							<motion.div
								key="2FA_VERIFY"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
							>
								<TwoFactorVerify
									onVerify={handleTwoFactorVerify}
									onCancel={() => {
										setLoginView('credentials')
									}}
								/>
							</motion.div>
						)}
						{loginView === 'forgot-password' && (
							<motion.div
								key="FORGOT_PASSWORD"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
							>
								<div className="space-y-4">
									<div className="space-y-2 text-center">
										<h2 className="text-xl font-semibold tracking-tight">Reset your password</h2>
										<p className="text-sm text-muted-foreground">
											We’ll email you a secure link to choose a new password.
										</p>
									</div>

									<div className="space-y-3">
										<Input
											type="email"
											placeholder="Your email"
											className="h-12 bg-transparent"
											value={forgotEmail}
											onChange={(e) => setForgotEmail(e.target.value)}
										/>

										<Button
											type="button"
											className="w-full h-12"
											disabled={forgotLoading}
											onClick={handleRequestPasswordReset}
										>
											{forgotLoading ? 'Sending link...' : 'Send reset link'}
										</Button>

										<Button
											type="button"
											variant="ghost"
											className="w-full"
											onClick={() => setLoginView('credentials')}
											disabled={forgotLoading}
										>
											Back to sign in
										</Button>
									</div>
								</div>
							</motion.div>
						)}
						{loginView === 'qr-login' && (
							<motion.div
								key="QR_LOGIN"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
							>
								<QrLogin
									onSuccess={() => {
										window.location.href = '/app'
									}}
									onCancel={() => {
										setLoginView('credentials')
									}}
								/>
							</motion.div>
						)}
						{loginView === 'credentials' && (
							<motion.div
								key="LOGIN_CREDS"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
							>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<FormField
											control={form.control}
											name="email"
											render={({field}) => (
												<FormItem>
													<FormControl>
														<Input
															type="email"
															placeholder="Your email"
															className="h-12 bg-transparent"
															{...field}
														/>
													</FormControl>
													<FormMessage/>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="password"
											render={({field}) => (
												<FormItem>
													<FormControl>
														<div className="relative">
															<Input
																type={showPassword ? 'text' : 'password'}
																placeholder="Your password"
																className="h-12 bg-transparent"
																{...field}
															/>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
																onClick={() => setShowPassword(!showPassword)}
															>
																{showPassword ? (
																	<EyeOff className="h-4 w-4"/>
																) : (
																	<Eye className="h-4 w-4"/>
																)}
															</Button>
														</div>
													</FormControl>
													<FormMessage/>
												</FormItem>
											)}
										/>
										<div className="flex items-center justify-between">
											<Button
												type="button"
												variant="link"
												className="px-0 text-sm"
												onClick={() => {
													setForgotEmail(form.getValues('email') || '')
													setLoginView('forgot-password')
												}}
											>
												Forgot password?
											</Button>
										</div>
										<Button type="submit" className="w-full h-12" disabled={isLoading}>
											{isLoading ? 'Getting you in...' : 'Welcome back'}
										</Button>

										<div className="relative">
											<div className="absolute inset-0 flex items-center">
												<span className="w-full border-t" />
											</div>
											<div className="relative flex justify-center text-xs uppercase">
												<span className="bg-background px-2 text-muted-foreground">Or</span>
											</div>
										</div>

										<Button
											type="button"
											variant="outline"
											className="w-full h-12"
											onClick={() => setLoginView('qr-login')}
										>
											<QrCode className="h-4 w-4 mr-2" />
											Login with Mobile App
										</Button>
									</form>
								</Form>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>

				<motion.p
					className="px-8 text-center text-sm text-muted-foreground"
					layout="position"
					layoutId="footer"
					transition={springTransition}
				>
					Don&apos;t have an account?{' '}
					<Link
						prefetch={true}
						href="/register"
						className="underline underline-offset-4 hover:text-primary"
					>
						Create account
					</Link>
				</motion.p>
			</div>
		</LayoutGroup>
	)
}

export default LoginForm
