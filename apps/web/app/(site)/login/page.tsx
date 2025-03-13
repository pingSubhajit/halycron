import LoginForm from '@/app/(site)/login/login-form'
import banner from '@/public/banner_square.png'
import Image from 'next/image'
import {Metadata} from 'next'

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
				<LoginForm/>
			</div>
		</div>
	)
}

export default LoginPage
