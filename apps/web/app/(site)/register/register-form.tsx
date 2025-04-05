'use client'

import {useState} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Eye, EyeOff} from 'lucide-react'
import {Button} from '@halycron/ui/components/button'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import {Input} from '@halycron/ui/components/input'
import {authClient} from '@/lib/auth/auth-client'
import {toast} from 'sonner'
import {TwoFactorSetup} from '@/components/two-factor-setup'
import {useLogout} from '@/lib/auth/use-logout'
import {useQueryState} from 'nuqs'
import {AnimatePresence, LayoutGroup, motion} from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'

const formSchema = z.object({
	email: z.string().email('Hmm, that doesn\'t look like a valid email. Mind trying again?'),
	password: z
		.string()
		.min(12, 'A bit longer please—at least 12 characters for your security')
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[A-Za-z\d\W_]+$/,
			'Mix it up! Include uppercase, lowercase, numbers, and a special character for a strong password'
		),
	name: z.string().min(2, 'We\'d love to know your name (at least 2 characters)')
})

const RegisterForm = () => {
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const {logout} = useLogout()
	const [twofa, setTwofa] = useQueryState<'form' | '2fa'>('twoFa', {
		defaultValue: 'form',
		parse: (value): 'form' | '2fa' => {
			if (value === 'form' || value === '2fa') {
				return value
			}
			return 'form'
		}
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
			name: ''
		}
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			setIsLoading(true)
			const {data, error} = await authClient.signUp.email({
				email: values.email,
				password: values.password,
				name: values.name
			})

			if (error || !data) {
				throw error || new Error('Oops! Something went wrong with account creation')
			}

			const {data: loginData, error: loginError} = await authClient.signIn.email({
				email: values.email,
				password: values.password
			})

			if (loginError || !loginData) {
				throw loginError || new Error('We got your account set up, but had trouble signing you in. Try logging in again.')
			}

			setTwofa('2fa')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Something unexpected happened. Let\'s try again?')
		} finally {
			setIsLoading(false)
		}
	}

	const onTwoFactorComplete = () => {
		toast.success('Perfect! Your account is now extra secure with 2FA.')
		logout()
	}

	// Shared spring transition for all layout animations
	const springTransition = {
		type: 'spring',
		stiffness: 250,
		damping: 25,
		mass: 1
	}

	return (
		<LayoutGroup id="register-form-layout">
			<div className="mx-auto w-full max-w-md space-y-6">
				{twofa !== '2fa' && <motion.div
					className="flex flex-col text-center items-center"
					layout="position"
					layoutId="register-header"
					transition={springTransition}
				>
					<Link prefetch={true} href="/"><Image src={logo} alt="Halycron Logo" className="w-32"/></Link>

					<h1 className="mt-8 text-2xl font-semibold tracking-tight">
						Create your account
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Fill in your details to get started with Halycron
					</p>
				</motion.div>}

				<motion.div
					layout="position"
					layoutId="register-content"
					transition={springTransition}
				>
					<AnimatePresence mode="wait" initial={false}>
						{twofa === '2fa' ? (
							<motion.div
								key="2FA_SETUP"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
							>
								<TwoFactorSetup onComplete={onTwoFactorComplete}/>
							</motion.div>
						) : (
							<motion.div
								key="REGISTER_FORM"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
							>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<FormField
											control={form.control}
											name="name"
											render={({field}) => (
												<FormItem>
													<FormControl>
														<Input
															placeholder="What should we call you?"
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
																placeholder="Create a strong password"
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
											{isLoading ? 'Setting things up...' : 'Let\'s get started'}
										</Button>
									</form>
								</Form>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>

				{twofa !== '2fa' && <motion.p
					className="px-8 text-center text-sm text-muted-foreground"
					layout="position"
					layoutId="register-footer"
					transition={springTransition}
				>
					Already have an account?{' '}
					<Link
						prefetch={true}
						href="/login"
						className="underline underline-offset-4 hover:text-primary"
					>
						Sign in
					</Link>
				</motion.p>}
			</div>
		</LayoutGroup>
	)
}

export default RegisterForm
