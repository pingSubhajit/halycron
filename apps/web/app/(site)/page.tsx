import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'
import {Metadata} from 'next'
import {GetStartedButton} from '@/app/(site)/get-started-button'
import {ArrowUpRight} from 'lucide-react'

export const metadata: Metadata = {
	title: 'Halycron – The Ultimate Private & Secure Photo Vault',
	description: 'Halycron is a highly secure, end-to-end encrypted photo storage solution. Store, organize, and manage your photos in your personal or private S3 bucket with zero-knowledge encryption. Keep your memories safe—only you can access them.',
	keywords: [
		'secure photo vault',
		'private photo storage',
		'encrypted photo storage',
		'self-hosted photo backup',
		'S3 photo storage',
		'end-to-end encrypted gallery',
		'secure cloud storage',
		'private photo album',
		'security-focused photo manager'
	]
}

const Page = () => (
	<div className="flex justify-center min-h-svh relative py-32 px-4 bg-neutral-950">
		<div className="max-w-[800px] w-full flex flex-col gap-32 items-center">
			<section className="flex flex-col gap-10 items-center">
				<Image src={logo} alt="Halycron Logo" className="w-44"/>

				<div className="flex flex-col items-center justify-center gap-4">
					<h1 className="font-semibold text-6xl text-center leading-tight">Truly private photo storage on cloud</h1>

					<p className="text-lg opacity-60 leading-normal text-center max-w-[80%]">
						Halycron is a <em className="font-serif font-medium">secure, private</em> photo vault designed to keep
						your memories safe. With advanced end-to-end encryption, album protection, and complete control over
						your storage, your photos remain yours—hidden, locked, and accessible only to you.
					</p>
				</div>

				<div className="flex flex-col items-center gap-4">
					<GetStartedButton />

					<a href="https://github.com/pingSubhajit/halycron?tab=readme-ov-file" target="_blank" className="flex items-center gap-1 hover:underline underline-offset-8 opacity-60 hover:opacity-100 focus-visible:opacity-100 transition-opacity" rel="noreferrer">
						<h2 className="font-medium">Check the source code on <em className="font-serif">Github</em></h2>
						<ArrowUpRight className="w-4 h-4" />
					</a>
				</div>
			</section>

			<section className="grid grid-cols-2 gap-4">
				{/* MANDATORY MFA */}
				<div className="bg-background p-4 flex flex-col gap-2">
					<video src="/mandatory-mfa.mp4" autoPlay muted loop></video>

					<h3 className="mt-4 font-medium text-lg">Mandatory MFA</h3>
					<p className="text-sm opacity-60 leading-normal">
						Two factor authentication and strong password is a requirement for each account. While it
						might be inconvenient for most, we strongly believe that it's benefit outweigh the
						compromises by a large margin for such security critical app.
					</p>
				</div>

				{/* ZERO-KNOWLEDGE ARCHITECTURE */}
				<div className="bg-background p-4 flex flex-col gap-2">
					<video src="/zero-knowledge.mp4" autoPlay muted loop></video>

					<h3 className="mt-4 font-medium text-lg">Zero-knowledge architecture</h3>
					<p className="text-sm opacity-60 leading-normal">
						Nobody except you can decrypt your photos, even those with the physical access of the server. We encrypt and decrypt your photos on your device and store the encrypted data on the server. The keys are also encrypted securely.
					</p>
				</div>
			</section>

			<section>
				<p className="text-3xl leading-snug text-center">
					I believe that privacy is not a privilege — it’s a right. In an age where our memories are
					scattered across the cloud, buried in algorithms, and vulnerable to prying eyes, we’ve lost
					control over what should be <em className="font-serif font-medium">ours alone.</em> Halycron was
					born from the frustration of not having a <em className="font-serif font-medium">truly private space</em> for
					our most personal moments. Existing solutions promise security but come
					with compromises: hidden terms, backdoors, or the uneasy feeling that your data is never
					entirely yours.
				</p>
			</section>

			<section className="grid grid-cols-2 gap-4">
				{/* MANDATORY MFA */}
				<div className="bg-background p-4 flex flex-col gap-2">
					<video src="/mandatory-mfa.mp4" autoPlay muted loop></video>

					<h3 className="mt-4 font-medium text-lg">Sensitive & protected albums</h3>
					<p className="text-sm opacity-60 leading-normal">
						Two factor authentication and strong password is a requirement for each account. While it
						might be inconvenient for most, we strongly believe that it's benefit outweigh the
						compromises by a large margin for such security critical app.
					</p>
				</div>

				{/* ZERO-KNOWLEDGE ARCHITECTURE */}
				<div className="bg-background p-4 flex flex-col gap-2">
					<video src="/zero-knowledge.mp4" autoPlay muted loop></video>

					<h3 className="mt-4 font-medium text-lg">Share securely with others</h3>
					<p className="text-sm opacity-60 leading-normal">
						Nobody except you can decrypt your photos, even those with the physical access of the server.
						We encrypt and decrypt your photos on your device and store the encrypted data on the server.
						The keys are also encrypted securely.
					</p>
				</div>
			</section>

			<section>
				<p className="text-3xl leading-snug text-center">
					I built Halycron for those who want peace of mind, not just convenience. A place where your photos
					stay locked away unless you decide otherwise. A place where trust isn’t assumed but proven through
					encryption, protection, and control. Every image you store here is yours—untouched, untracked, and
					inaccessible to anyone but you. Because privacy isn’t something you should have to ask for. It
					should be the default.
				</p>
			</section>

			<section className="flex flex-col gap-4 items-center max-w-[80%]">
				<h2 className="font-semibold text-4xl text-center leading-snug">Start saving your memories from prying eyes starting today</h2>

				<GetStartedButton />
			</section>
		</div>
	</div>
)

export default Page
