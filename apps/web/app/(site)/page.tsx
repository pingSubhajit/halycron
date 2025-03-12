import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'
import {Metadata} from 'next'
import {GetStartedButton} from '@/app/(site)/get-started-button'
import {ArrowUpRight} from 'lucide-react'
import letrazLogo from '@halycron/ui/media/letraz-logo.svg'

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
	<div className="flex flex-col items-center gap-32 min-h-svh relative pt-32 pb-8 px-4 bg-neutral-950">
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
				<div className="bg-card p-4 flex flex-col gap-2">
					<video src="/mandatory-mfa.mp4" autoPlay muted loop></video>

					<h3 className="mt-4 font-medium text-lg">Mandatory MFA</h3>
					<p className="text-sm opacity-60 leading-normal">
						Two factor authentication and strong password is a requirement for each account. While it
						might be inconvenient for most, we strongly believe that it's benefit outweigh the
						compromises by a large margin for such security critical app.
					</p>
				</div>

				{/* ZERO-KNOWLEDGE ARCHITECTURE */}
				<div className="bg-card p-4 flex flex-col gap-2">
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
				<div className="bg-card p-4 flex flex-col gap-2">
					<video src="/protected-album.mp4" autoPlay muted loop></video>

					<h3 className="mt-4 font-medium text-lg">Sensitive & protected albums</h3>
					<p className="text-sm opacity-60 leading-normal">
						Protect your most sensitive photos with a password. Save them from people with physical access
						of your device or just add them as an extra layer of security on top. Sensitive photos and
						totally protected photos do not show up in the gallery.
					</p>
				</div>

				{/* ZERO-KNOWLEDGE ARCHITECTURE */}
				<div className="bg-card p-4 flex flex-col gap-2">
					<video src="/shareable-link.mp4" autoPlay muted loop></video>

					<h3 className="mt-4 font-medium text-lg">Share securely with others</h3>
					<p className="text-sm opacity-60 leading-normal">
						Create auto-expiring, even optionally pin-secured shareable link for your photos or albums.
						Anybody with access to the link, provided they entered the correct pin set by you would be
						able to see what you shared for the set amount of time that you choose.
					</p>
				</div>
			</section>

			<section>
				<p className="text-3xl leading-snug text-center">
					I built Halycron for those who want <em className="font-serif font-medium">peace of mind</em>, not
					just convenience. A place where your photos stay locked away unless you decide otherwise. A place
					where trust isn’t assumed but proven
					through <em className="font-serif font-medium">encryption, protection, and control.</em> Every
					image you store here is yours — untouched, untracked, and inaccessible to anyone but you. Because
					privacy isn’t something you should have to ask for. It should be
					the <em className="font-serif font-medium">default</em>.
				</p>
			</section>

			<section className="flex flex-col gap-4 items-center max-w-[80%]">
				<h2 className="font-semibold text-4xl text-center leading-snug">Start saving your memories from prying eyes starting today</h2>

				<GetStartedButton />
			</section>
		</div>

		<footer className="max-w-[1200px] w-full flex items-center justify-center gap-8">
			<p className="text-center text-sm opacity-60 hover:opacity-100 transition-opacity">
				&copy; Built by <a href="https://x.com/ping_subhajit" target="_blank" className="underline"
					rel="noreferrer">@ping_subhajit</a>
			</p>

			<p className="text-center text-sm opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1">
				A product from <a href="https://letraz.app" target="_blank"
					className="underline flex items-center gap-1" rel="noreferrer">
					<Image src={letrazLogo} alt="Letraz logo" className="w-8"/> @letrazApp
				</a>
			</p>
		</footer>
	</div>
)

export default Page
