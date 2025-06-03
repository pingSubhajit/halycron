'use client'

import {LogOut} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@halycron/ui/components/dropdown-menu'
import {Button} from '@halycron/ui/components/button'
import {useLogout} from '@/lib/auth/use-logout'
import {authClient} from '@/lib/auth/auth-client'
import {ProfilePicture} from '@/components/profile-picture'
import Link from 'next/link'

export const UserMenu = () => {
	const {logout, isLoading} = useLogout()

	const {
		data: session
	} = authClient.useSession()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="h-10 w-10 rounded-none"
				>
					<ProfilePicture
						userImage={session?.user?.image}
						userEmail={session?.user?.email}
						userName={session?.user?.name}
						className="h-9 w-10 rounded-none"
						fallbackClassName="rounded-none"
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-64">
				<DropdownMenuLabel className="flex items-center gap-2">
					<ProfilePicture
						userImage={session?.user?.image}
						userEmail={session?.user?.email}
						userName={session?.user?.name}
						className="h-10 w-10 rounded-none"
						fallbackClassName="rounded-none"
					/>

					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none truncate">{session?.user.name || 'One moment...'}</p>
						<p className="text-sm leading-none truncate">{session?.user.email || 'One moment...'}</p>
					</div>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<span>Profile</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<span>Settings</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<span>Email preferences</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<span>Security</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<span>Account settings</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<span>Shield</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />
				<Link prefetch={true} href="/home"><DropdownMenuItem>
					<span>Home page</span>
				</DropdownMenuItem></Link>
				<DropdownMenuItem
					disabled={isLoading}
					onSelect={() => logout()}
					className="flex items-center justify-between"
				>
					<span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
					<LogOut className="h-4 w-4" />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
