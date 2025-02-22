'use client'

import {LogOut, User} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@halycon/ui/components/dropdown-menu'
import {Button} from '@halycon/ui/components/button'
import {useLogout} from '@/lib/auth/use-logout'
import {Avatar, AvatarFallback, AvatarImage} from '@halycon/ui/components/avatar'
import {createAuthClient} from 'better-auth/react'
import Link from 'next/link'

const {useSession} = createAuthClient()

export const UserMenu = () => {
	const {logout, isLoading} = useLogout()

	const {
		data: session
	} = useSession()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="h-10 w-10 rounded-none"
				>
					<Avatar className="h-10 w-10 rounded-none">
						<AvatarImage src={
							session?.user?.email
								? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(session?.user.email)}`
								: undefined} alt={session?.user?.name || 'User avatar'}
						/>
						<AvatarFallback className="rounded-none">
							<User className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-64">
				<DropdownMenuLabel className="flex items-center gap-2">
					<Avatar className="h-10 w-10 rounded-none">
						<AvatarImage src={
							session?.user?.email
								? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(session?.user.email)}`
								: undefined} alt={session?.user?.name || 'User avatar'}
						/>
						<AvatarFallback className="rounded-none">
							<User className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>

					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none truncate">{session?.user.name || 'Loading...'}</p>
						<p className="text-sm leading-none text-muted-foreground truncate">{session?.user.email || 'Loading...'}</p>
					</div>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer text-muted-foreground">
					<span>Profile</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer text-muted-foreground">
					<span>Settings</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer text-muted-foreground">
					<span>Email preferences</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer text-muted-foreground">
					<span>Security</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer text-muted-foreground">
					<span>Account settings</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer text-muted-foreground">
					<span>Shield</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />
				<Link href="/"><DropdownMenuItem className="cursor-pointer text-muted-foreground">
					<span>Home page</span>
				</DropdownMenuItem></Link>
				<DropdownMenuItem
					disabled={isLoading}
					onClick={() => logout()}
					className="cursor-pointer flex items-center justify-between text-muted-foreground"
				>
					<span>{isLoading ? 'Logging out...' : 'Log out'}</span>
					<LogOut className="mr-2 h-4 w-4" />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
