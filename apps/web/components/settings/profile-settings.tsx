'use client'

import {useEffect, useState} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@halycron/ui/components/form'
import {Input} from '@halycron/ui/components/input'
import {Badge} from '@halycron/ui/components/badge'
import {Separator} from '@halycron/ui/components/separator'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@halycron/ui/components/dialog'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@halycron/ui/components/tooltip'
import {AlertCircle, AlertTriangle, BookUser, Calendar, Camera, Lock, Mail, Trash2, User} from 'lucide-react'
import {authClient} from '@/lib/auth/auth-client'
import {toast} from 'sonner'
import {useUpdateProfile} from '@/app/api/profile/mutations'
import {useSendVerificationEmail} from '@/app/api/auth/mutations'
import type {Session} from '@/types/auth'
import {ProfilePictureModal} from './profile-picture-modal'
import {ProfilePicture} from '../profile-picture'

const profileFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Please enter a valid email address')
})

interface ProfileSettingsProps {
	initialSession: Session
}

export const ProfileSettings = ({initialSession}: ProfileSettingsProps) => {
	const {data: session, refetch: refetchSession} = authClient.useSession()
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const sendVerificationEmail = useSendVerificationEmail()

	// Use client session if available, otherwise use initial session
	const currentSession = session || initialSession

	const form = useForm<z.infer<typeof profileFormSchema>>({
		resolver: zodResolver(profileFormSchema),
		defaultValues: {
			name: initialSession.user.name || '',
			email: initialSession.user.email || ''
		}
	})

	// Update form values when session data changes
	useEffect(() => {
		if (currentSession?.user) {
			form.reset({
				name: currentSession.user.name || '',
				email: currentSession.user.email || ''
			})
		}
	}, [currentSession, form])

	const updateProfile = useUpdateProfile({
		onSuccess: async () => {
			// Refresh session to get updated user data
			await refetchSession()
			toast.success('Profile updated successfully!')
		},
		onError: (error) => {
			console.error('Profile update failed:', error)
			toast.error(error.message || 'Failed to update profile')
		}
	})

	const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
		updateProfile.mutate({
			name: values.name
		})
	}

	const handleDeleteAccount = async () => {
		setIsDeleting(true)
		try {
			// TODO: Implement account deletion API call
			await new Promise(resolve => setTimeout(resolve, 2000))

			// Sign out the user after account deletion
			await authClient.signOut()

			// Show success message
			toast.success('Account deleted successfully')

			// Redirect to home page
			window.location.href = '/'
		} catch (error) {
			console.error('Failed to delete account:', error)
			toast.error('Failed to delete account. Please try again.')
		} finally {
			setIsDeleting(false)
			setShowDeleteConfirmation(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* Profile Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5"/>
						Profile Information
					</CardTitle>
					<CardDescription>
						Manage your personal information and account details
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Profile Picture Section */}
					<div className="flex items-center gap-6">
						<div
							className="relative group cursor-pointer"
							onClick={() => setIsModalOpen(true)}
						>
							<div className="transition-all group-hover:brightness-75">
								<ProfilePicture
									userImage={currentSession.user.image}
									userEmail={currentSession.user.email}
									userName={currentSession.user.name}
									className="h-24 w-24 border-2 border-border"
									fallbackClassName="text-lg"
								/>
							</div>

							{/* Edit Overlay */}
							<div
								className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
								<Camera className="h-6 w-6 text-white"/>
							</div>
						</div>

						<div className="flex-1">
							<h3 className="font-medium">Profile Picture</h3>
							<p className="text-sm text-muted-foreground mb-3">
								{currentSession.user.image
									? 'Click on your profile picture to upload a new one or remove it.'
									: 'Click to upload a profile picture to personalize your account.'
								}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsModalOpen(true)}
							>
								<Camera className="h-4 w-4 mr-1"/>
								{currentSession.user.image ? 'Change Photo' : 'Upload Photo'}
							</Button>
						</div>
					</div>

					{/* Profile Picture Modal */}
					<ProfilePictureModal
						isOpen={isModalOpen}
						onClose={() => setIsModalOpen(false)}
						currentImageUrl={currentSession.user.image || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(currentSession.user.email)}`}
						userEmail={currentSession.user.email}
						userName={currentSession.user.name}
						onUploadSuccess={async () => {
							// Refresh session to get updated user data
							await refetchSession()
						}}
					/>

					<Separator/>

					{/* Profile Form */}
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({field}) => (
										<FormItem>
											<FormLabel>Display Name</FormLabel>
											<FormControl>
												<Input placeholder="Your display name" {...field} />
											</FormControl>
											<FormMessage/>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="email"
									render={({field}) => (
										<FormItem>
											<FormLabel className="">
												Email Address
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<Lock className="ml-2 h-3 w-3 text-muted-foreground"/>
														</TooltipTrigger>
														<TooltipContent>
															<p>Email address cannot be changed for security reasons</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														placeholder="your@email.com"
														{...field}
														disabled
														className="bg-muted/50"
													/>
												</div>
											</FormControl>
											<FormMessage/>
										</FormItem>
									)}
								/>
							</div>

							<div className="flex items-center justify-between pt-4">
								<div className="text-sm text-muted-foreground">
									Changes will be saved to your account
								</div>
								<Button type="submit" disabled={!form.formState.isDirty || updateProfile.isPending}>
									{updateProfile.isPending ? 'Saving...' : 'Save Changes'}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Account Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookUser className="h-5 w-5"/>
						Account Status
					</CardTitle>
					<CardDescription>
						Overview of your account verification and status
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex items-center justify-between p-4 border">
							<div className="flex items-center gap-3">
								<Mail className="h-5 w-5 text-muted-foreground"/>
								<div>
									<div className="font-medium">Email Verification</div>
									<div className="text-sm text-muted-foreground">
										{currentSession.user.email}
									</div>
								</div>
							</div>
							{currentSession.user.emailVerified ? (
								<Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
									Verified
								</Badge>
							) : (
								<Badge variant="secondary"
									className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
									Pending
								</Badge>
							)}
						</div>

						<div className="flex items-center justify-between p-4 border">
							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-muted-foreground"/>
								<div>
									<div className="font-medium">Member Since</div>
									<div className="text-sm text-muted-foreground">
										{new Date(currentSession.user.createdAt || '').toLocaleDateString('en-GB', {
											year: 'numeric',
											month: '2-digit',
											day: '2-digit'
										})}
									</div>
								</div>
							</div>
							<Badge variant="outline">
								Active
							</Badge>
						</div>
					</div>

					{!currentSession.user.emailVerified && (
						<div className="p-4 bg-yellow-500/10 border border-yellow-500/20">
							<div className="flex items-center gap-2 text-yellow-600">
								<AlertCircle className="h-4 w-4"/>
								<span className="font-medium">Email Verification Required</span>
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								Please check your email and verify your account to access all features.
							</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-3"
								onClick={() => sendVerificationEmail.mutate()}
								disabled={sendVerificationEmail.isPending}
							>
								{sendVerificationEmail.isPending ? 'Sending...' : 'Resend Verification Email'}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trash2 className="h-5 w-5"/>
						Account Management
					</CardTitle>
					<CardDescription>
						Permanently delete your account and all associated data
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="relative p-6 border-2 border-destructive/30 bg-destructive/5">
						<div className="absolute -top-2 left-4 bg-background px-2">
							<div className="flex items-center gap-1">
								<AlertTriangle className="h-4 w-4 text-destructive"/>
								<span className="text-sm font-semibold text-destructive uppercase tracking-wide">Danger Zone</span>
							</div>
						</div>

						<div className="flex items-start justify-between gap-4 mt-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<Trash2 className="h-5 w-5 text-destructive"/>
									<h4 className="font-semibold text-destructive">Delete Account</h4>
								</div>
								<p className="text-sm text-muted-foreground leading-relaxed">
									This action will permanently delete your account and <strong>all associated
										data</strong>.
									<br/>
									<span className="text-destructive/80 font-medium">This cannot be undone.</span>
								</p>
							</div>

							<Button
								variant="destructive"
								size="sm"
								onClick={() => setShowDeleteConfirmation(true)}
								className="shrink-0"
							>
								<Trash2 className="h-4 w-4 mr-2"/>
								Delete Account
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
				<DialogContent className="sm:max-w-md border-destructive/20 bg-destructive/5 backdrop-blur-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive">
							<AlertTriangle className="h-5 w-5"/>
							Delete Account
						</DialogTitle>
						<DialogDescription className="text-left">
							You are about to permanently delete your
							account <strong>{currentSession.user.email}</strong>.
							This action cannot be undone and will immediately sign you out.
						</DialogDescription>
					</DialogHeader>

					<div className="p-4 bg-destructive/5 border border-destructive/20">
						<div className="flex items-start gap-3">
							<AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5"/>
							<div className="text-sm">
								<p className="font-medium text-destructive mb-1">This will permanently:</p>
								<ul className="text-muted-foreground space-y-1">
									<li>• Delete your account and profile information</li>
									<li>• Remove all your photos and metadata</li>
									<li>• Clear all storage and cached data</li>
									<li>• Cancel any active subscriptions</li>
									<li>• Sign you out of all devices</li>
								</ul>
							</div>
						</div>
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							onClick={() => setShowDeleteConfirmation(false)}
							className="w-full sm:w-auto border-destructive/10 bg-destructive/5 hover:bg-destructive/10 hover:border-destructive/20"
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							disabled={isDeleting}
							className="w-full sm:w-auto"
						>
							{isDeleting ? (
								<>
									<div
										className="animate-spin h-4 w-4 border-2 border-white border-t-transparent mr-2"/>
									Deleting Account...
								</>
							) : (
								<>
									<Trash2 className="h-4 w-4 mr-2"/>
									Yes, Delete My Account
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
