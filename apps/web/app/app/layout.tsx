import {SidebarProvider, SidebarTrigger} from '@halycon/ui/components/sidebar'
import {AppSidebar} from '@/components/app-sidebar'
import {ReactNode} from 'react'

const DashboardLayout = ({children}: {children: ReactNode}) => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="p-4 w-full bg-background">
				<SidebarTrigger />
				{children}
			</main>
		</SidebarProvider>
	)
}

export default DashboardLayout
