import RegisterForm from '@/app/(site)/register/register-form'
import banner from '@/public/banner_square.png'
import Image from 'next/image'
import Link from 'next/link'
import {Suspense} from 'react'
import {Metadata} from 'next'
import logo from '@halycron/ui/media/logo.svg'

export const metadata: Metadata = {
	title: 'Halycron Sign Up – Create Your Secure Photo Vault Account',
	description: 'Join Halycron and secure your photos with end-to-end encryption. Sign up now to store, manage, and access your private images safely in your personal or private S3 bucket.',
	keywords: [
		'Halycron sign up',
		'secure photo vault registration',
		'encrypted photo storage account',
		'private photo storage signup',
		'secure cloud photo backup'
	]
}

const RegisterPage = () => {
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
						<Link href="/app"><Image src={logo} alt="Halycron Logo" className="w-32" /></Link>

						<h1 className="mt-8 text-2xl font-semibold tracking-tight">Create an account</h1>
						<p className=" mt-2 text-sm text-muted-foreground">
							Enter your details below to create your account
						</p>
					</div>

					<Suspense fallback={<div>Loading...</div>}>
						<RegisterForm />
					</Suspense>

					<p className="px-8 text-center text-sm text-muted-foreground">
						Already have an account?{' '}
						<Link
							href="/login"
							className="underline underline-offset-4 hover:text-primary"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default RegisterPage

