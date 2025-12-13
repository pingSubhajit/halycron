'use client'

import {useMemo, useState} from 'react'
import {useSearchParams} from 'next/navigation'
import {AnimatePresence, motion} from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'
import {Button} from '@halycron/ui/components/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycron/ui/components/form'
import {Input} from '@halycron/ui/components/input'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {authClient} from '@/lib/auth/auth-client'
import {toast} from 'sonner'
import {Eye, EyeOff, ShieldAlert} from 'lucide-react'

const passwordSchema = z
	.string()
	.min(12, 'A bit longer please—at least 12 characters for your security')
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[A-Za-z\d\W_]+$/,
		'Mix it up! Include uppercase, lowercase, numbers, and a special character for a strong password'
	)

const formSchema = z.object({
	newPassword: passwordSchema
})

const ResetPasswordClient = () => {
	const searchParams = useSearchParams()
	const token = searchParams.get('token')
	const error = searchParams.get('error')

	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [completed, setCompleted] = useState(false)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			newPassword: ''
		}
	})

	const status = useMemo<'invalid' | 'ready'>(() => {
		if (error) return 'invalid'
		if (!token) return 'invalid'
		return 'ready'
	}, [error, token])

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!token) {
			toast.error('This reset link is missing a token. Please request a new one.')
			return
		}

		try {
			setIsLoading(true)
			const {error: resetError} = await authClient.resetPassword({
				newPassword: values.newPassword,
				token
			} as never)

			if (resetError) {
				throw resetError
			}

			setCompleted(true)
			toast.success('Password updated. You can sign in now.')
		} catch (e) {
			console.error('resetPassword failed:', e)
			toast.error('That link looks expired or invalid. Please request a fresh reset link.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-center text-center">
				<Link prefetch={true} href="/">
					<Image src={logo} alt="Halycron Logo" className="w-32"/>
				</Link>
			</div>

			<Card className="bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
				<CardHeader className="text-center space-y-2">
					<CardTitle className="text-2xl tracking-tight">Set a new password</CardTitle>
					<CardDescription>
						Choose a strong password to protect your vault.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<AnimatePresence mode="wait" initial={false}>
						{completed ? (
							<motion.div
								key="DONE"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
								className="space-y-4"
							>
								<div className="text-sm text-muted-foreground text-center">
									All set. Sign in with your new password.
								</div>
								<Button asChild className="w-full h-12">
									<Link href="/login">Back to sign in</Link>
								</Button>
							</motion.div>
						) : status === 'invalid' ? (
							<motion.div
								key="INVALID"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
								className="space-y-4"
							>
								<div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
									<ShieldAlert className="h-5 w-5 text-destructive mt-0.5"/>
									<div className="space-y-1">
										<div className="text-sm font-medium">This reset link isn’t valid</div>
										<div className="text-sm text-muted-foreground">
											It may have expired or already been used. Request a new one from the login screen.
										</div>
									</div>
								</div>

								<Button asChild className="w-full h-12">
									<Link href="/login">Back to login</Link>
								</Button>
							</motion.div>
						) : (
							<motion.div
								key="FORM"
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.2}}
							>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<FormField
											control={form.control}
											name="newPassword"
											render={({field}) => (
												<FormItem>
													<FormControl>
														<div className="relative">
															<Input
																type={showPassword ? 'text' : 'password'}
																placeholder="New password"
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
											{isLoading ? 'Updating password...' : 'Update password'}
										</Button>

										<Button variant="ghost" className="w-full" asChild>
											<Link href="/login">Back to sign in</Link>
										</Button>
									</form>
								</Form>
							</motion.div>
						)}
					</AnimatePresence>
				</CardContent>
			</Card>
		</div>
	)
}

export default ResetPasswordClient


