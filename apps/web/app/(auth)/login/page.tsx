import LoginForm from '@/app/(auth)/login/login-form'
import banner from '@/public/banner_square.png'
import Image from 'next/image'
import Link from 'next/link'

const LoginPage = () => {
	return (
		<div className="bg-dark grid h-screen w-screen lg:grid-cols-2">
			<div className="relative hidden lg:block">
				<Image
					src={banner}
					alt="Authentication background"
					className="object-cover w-full h-full"
					priority
				/>
			</div>
			<div className="flex items-center justify-center p-8">
				<div className="mx-auto w-full max-w-[350px] space-y-6">
					<div className="flex flex-col space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
						<p className="text-sm text-muted-foreground">
							Enter your credentials to sign in to your account
						</p>
					</div>

					<LoginForm />

					<p className="px-8 text-center text-sm text-muted-foreground">
						Don&apos;t have an account?{' '}
						<Link
							href="/register"
							className="underline underline-offset-4 hover:text-primary"
						>
							Create account
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default LoginPage
