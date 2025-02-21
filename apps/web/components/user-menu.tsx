'use client'

import {LogOut, Mail, Settings, Shield, User, UserCircle} from 'lucide-react'
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
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{session?.user.name || 'Loading...'}</p>
						<p className="text-xs leading-none text-muted-foreground">{session?.user.email || 'Loading...'}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer">
					<UserCircle className="mr-2 h-4 w-4" />
					<span>Profile</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer">
					<Settings className="mr-2 h-4 w-4" />
					<span>Settings</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer">
					<Mail className="mr-2 h-4 w-4" />
					<span>Email preferences</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer">
					<Shield className="mr-2 h-4 w-4" />
					<span>Security</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={isLoading}
					onClick={() => logout()}
					className="text-destructive focus:text-destructive cursor-pointer"
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
