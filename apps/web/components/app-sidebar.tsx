'use client'

import logo from '@halycon/ui/media/logo.svg'
import Image from 'next/image'
import {Image as ImageIcon, Images} from 'lucide-react'
import {usePathname} from 'next/navigation'
import {Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from '@halycon/ui/components/sidebar'

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
			<SidebarContent className="px-6 py-10 bg-dark">
				<Image src={logo} alt="Halycron Logo" className="w-[60%]" />

				<SidebarMenu className="mt-8">
					{baseItems.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild size="lg" isActive={pathname === item.url}>
								<a href={item.url}>
									<item.icon className="!size-5" />
									<span>{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
		</Sidebar>
	)
}
