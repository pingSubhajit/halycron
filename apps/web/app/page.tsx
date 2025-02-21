import bg from '@halycon/ui/media/bg.png'
import Image from 'next/image'
import {GetStartedButton} from '@/app/get-started-button'
import logo from '@halycon/ui/media/logo.svg'

const Page = () => (
	<div className="flex items-end pb-28 justify-center h-svh relative overflow-y-hidden px-4">
		<Image
			src={bg}
			alt="Background image of gianormous Halycront vault sitting proudly over a shallow river in a dusk sky background"
			className="absolute -z-10 object-cover"
			fill={true}
			priority={true}
		/>

		<div className="absolute w-screen px-20 py-6 top-0 inset-x-0 flex justify-between items-center">
			<Image src={logo} alt="Halycron Logo" className="w-32" />
		</div>

		<div className="flex flex-col items-center justify-center gap-4 max-w-[1300px]">
			<h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-[64px] font-bold font-grotesque text-center">Private photo storage for your peace of mind</h1>
			<p className="font-mono text-center text-sm lg:text-base max-w-[600px] mb-4">
				Store your photos in your own terms, bring your own storage, end-to-end encrypted, security focused, only you can access your photos
			</p>
			<GetStartedButton />
		</div>
	</div>
)

export default Page
