'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Eye, EyeOff} from 'lucide-react'
import {Button} from '@halycron/ui/components/button'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import {Input} from '@halycron/ui/components/input'
import {authClient} from '@/lib/auth/auth-client'
import {toast} from 'sonner'
import {TwoFactorVerify} from '@/components/two-factor-verify'
import {AnimatePresence, LayoutGroup, motion} from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'

const formSchema = z.object({
	email: z.string().email('Hmm, that doesn\'t look like a valid email. Mind trying again?'),
	password: z.string().min(1, 'We\'ll need your password to get you in')
})

const LoginForm = () => {
	const router = useRouter()
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [showTwoFactorVerify, setShowTwoFactorVerify] = useState(false)

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

			if (has2FA) {
				setShowTwoFactorVerify(true)
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
						{showTwoFactorVerify ? (
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
										setShowTwoFactorVerify(false)
									}}
								/>
							</motion.div>
						) : (
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
										<Button type="submit" className="w-full h-12" disabled={isLoading}>
											{isLoading ? 'Getting you in...' : 'Welcome back'}
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
