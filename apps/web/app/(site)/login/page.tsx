import LoginForm from '@/app/(site)/login/login-form'
import banner from '@/public/banner_square.png'
import Image from 'next/image'
import Link from 'next/link'
import {Metadata} from 'next'
import logo from '@halycron/ui/media/logo.svg'

export const metadata: Metadata = {
	title: 'Halycron Login – Securely Access Your Private Photo Vault',
	description: 'Log in to Halycron and access your private, encrypted photo vault. Your photos are stored securely with end-to-end encryption—only you can access them.',
	keywords: [
		'Halycron login',
		'secure photo vault login',
		'encrypted gallery access',
		'private photo storage login',
		'end-to-end encrypted photo storage'
	]
}

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
				<div className="mx-auto w-full max-w-md space-y-6">
					<div className="flex flex-col text-center items-center">
						<Link href="/"><Image src={logo} alt="Halycron Logo" className="w-32" /></Link>

						<h1 className="mt-8 text-2xl font-semibold tracking-tight">Welcome back</h1>
						<p className="mt-2 text-sm text-muted-foreground">
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
