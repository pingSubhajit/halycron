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

const formSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z
		.string()
		.min(12, 'Password must be at least 12 characters')
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[A-Za-z\d\W_]+$/,
			'Password must include uppercase, lowercase, numbers, and at least one special character'
		),
	name: z.string().min(2, 'Name must be at least 2 characters')
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
				throw error || new Error('Failed to create account')
			}

			const {data: loginData, error: loginError} = await authClient.signIn.email({
				email: values.email,
				password: values.password
			})

			if (loginError || !loginData) {
				throw loginError || new Error('Failed to sign in')
			}

			setTwofa('2fa')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
		} finally {
			setIsLoading(false)
		}
	}

	const onTwoFactorComplete = () => {
		toast.success('2FA setup completed!')
		logout()
	}

	if (twofa === '2fa') {
		return <TwoFactorSetup onComplete={onTwoFactorComplete} />
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({field}) => (
						<FormItem>
							<FormControl>
								<Input
									placeholder="Full Name"
									className="h-12 bg-transparent"
									{...field}
								/>
							</FormControl>
							<FormMessage />
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
									placeholder="Email Address"
									className="h-12 bg-transparent"
									{...field}
								/>
							</FormControl>
							<FormMessage />
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
										placeholder="Password"
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
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="w-full h-12" disabled={isLoading}>
					{isLoading ? 'Creating account...' : 'Create account'}
				</Button>
			</form>
		</Form>
	)
}

export default RegisterForm
