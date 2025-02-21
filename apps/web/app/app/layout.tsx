import {SidebarProvider, SidebarTrigger} from '@halycon/ui/components/sidebar'
import {AppSidebar} from '@/components/app-sidebar'
import {ReactNode} from 'react'
import {UserMenu} from '@/components/user-menu'
import {Button} from '@halycon/ui/components/button'
import {Upload} from 'lucide-react'

const DashboardLayout = ({children}: {children: ReactNode}) => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="w-full bg-background">
				<header className="p-4 border-b border-dashed flex items-center justify-between">
					<div className="flex items-center gap-1">
						<SidebarTrigger />
						<p>Dashboard</p>
					</div>

					<div className="flex items-center gap-2">
						<Button>
							<Upload className="size-4" />
							Add new
						</Button>
						<UserMenu />
					</div>
				</header>

				<main className="p-4">
					{children}
				</main>
			</div>
		</SidebarProvider>
	)
}

export default DashboardLayout
