'use client'

import logo from '@halycon/ui/media/logo.svg'
import Image from 'next/image'
import {Image as ImageIcon, Images} from 'lucide-react'
import {usePathname} from 'next/navigation'
import {Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from '@halycon/ui/components/sidebar'
import {PhotoUpload} from '@/components/photo-upload'
import Link from 'next/link'

const baseItems = [
	{
		title: 'Gallery',
		url: '/app',
		icon: ImageIcon
	},
	{
		title: 'Albums',
		url: '/app/albums',
		icon: Images
	}
]

export const AppSidebar = () => {
	const pathname = usePathname()

	return (
		<Sidebar>
			<SidebarContent className="px-6 py-10 flex flex-col justify-between">
				<div>
					<Link href="/app"><Image src={logo} alt="Halycron Logo" className="w-[60%]" /></Link>

					<SidebarMenu className="mt-8">
						{baseItems.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild size="lg" isActive={pathname === item.url}>
									<Link href={item.url}>
										<item.icon className="!size-5" />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</div>

				<PhotoUpload />
			</SidebarContent>
		</Sidebar>
	)
}
