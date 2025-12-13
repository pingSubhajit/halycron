import ResetPasswordClient from '@/app/(site)/reset-password/reset-password-client'
import banner from '@/public/banner_square.png'
import Image from 'next/image'
import {Suspense} from 'react'
import type {Metadata} from 'next'

export const metadata: Metadata = {
	title: 'Reset Password – Halycron',
	description: 'Reset your Halycron password securely and regain access to your private photo vault.'
}

const ResetPasswordPage = () => {
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
				<div className="mx-auto w-full max-w-md">
					<Suspense fallback={<div>Loading...</div>}>
						<ResetPasswordClient/>
					</Suspense>
				</div>
			</div>
		</div>
	)
}

export default ResetPasswordPage


