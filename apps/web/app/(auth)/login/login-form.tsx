'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Eye, EyeOff} from 'lucide-react'
import {Button} from '@halycon/ui/components/button'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@halycon/ui/components/form'
import {Input} from '@halycon/ui/components/input'
import {authClient} from '@/lib/auth/auth-client'
import {toast} from 'sonner'

const formSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required')
})

const LoginForm = () => {
	const router = useRouter()
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

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

			toast.success('Signed in successfully!')
			router.push('/app')
			router.refresh()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Invalid credentials')
		} finally {
			setIsLoading(false)
		}
	}

	return (
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
					{isLoading ? 'Signing in...' : 'Sign in'}
				</Button>
			</form>
		</Form>
	)
}

export default LoginForm
