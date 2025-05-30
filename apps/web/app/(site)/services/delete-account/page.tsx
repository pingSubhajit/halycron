import {Metadata} from 'next'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Alert, AlertDescription, AlertTitle} from '@halycron/ui/components/alert'
import {Badge} from '@halycron/ui/components/badge'
import {AlertTriangle, Clock, Mail, MessageCircle, Shield, Trash2} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Delete Your Account – Halycron',
	description: 'Learn how to permanently delete your Halycron account and all associated data. Follow our step-by-step guide for secure account deletion.',
	keywords: [
		'delete account',
		'remove account',
		'account deletion',
		'data removal',
		'privacy',
		'account management'
	]
}

const DeleteAccountPage = () => {
	return (
		<div className="min-h-screen bg-background">
			<div className="container max-w-4xl mx-auto px-4 py-16">
				{/* Header Section */}
				<div className="text-center mb-12">
					<div className="flex items-center justify-center gap-2 mb-4">
						<Trash2 className="h-8 w-8 text-destructive"/>
						<h1 className="text-4xl font-bold text-foreground">Delete Your Account</h1>
					</div>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						We're sorry to see you go. Follow the steps below to permanently delete your Halycron account
						and all associated data.
					</p>
				</div>

				{/* Warning Alert */}
				<Alert variant="destructive" className="mb-8">
					<AlertTriangle className="h-4 w-4"/>
					<AlertTitle>Permanent Action - Cannot Be Undone</AlertTitle>
					<AlertDescription>
						Once your account is deleted, all your photos, settings, and data will be permanently removed
						from our servers.
						This action cannot be reversed. Please ensure you've downloaded any photos you want to keep
						before proceeding.
					</AlertDescription>
				</Alert>

				{/* Step-by-Step Guide */}
				<div className="grid gap-6 mb-8">
					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<Badge variant="secondary" className="text-lg font-bold px-3 py-1">1</Badge>
								<CardTitle className="text-2xl">Backup Your Data (Optional)</CardTitle>
							</div>
							<CardDescription>
								Download any photos or data you want to keep before deletion
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<p className="text-muted-foreground">
									Before proceeding with account deletion, we recommend downloading any photos or data
									you wish to preserve.
									Once deleted, all content will be permanently removed from our servers.
								</p>
								<div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
									<Shield className="h-5 w-5 text-primary"/>
									<span className="text-sm">
										Your photos are encrypted and only accessible through your account while it exists.
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<Badge variant="secondary" className="text-lg font-bold px-3 py-1">2</Badge>
								<CardTitle className="text-2xl">Send Deletion Request</CardTitle>
							</div>
							<CardDescription>
								Email us from your registered account to request deletion
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								<p className="text-muted-foreground">
									To delete your account, send an email to our support team from the email address
									associated with your Halycron account.
								</p>

								<div className="border border-primary/20 rounded-lg p-6 bg-primary/5">
									<div className="flex items-center gap-3 mb-4">
										<Mail className="h-6 w-6 text-primary"/>
										<h3 className="text-lg font-semibold">Email Details</h3>
									</div>

									<div className="space-y-3">
										<div>
											<span className="font-medium text-sm text-muted-foreground">Send to:</span>
											<p className="text-lg font-mono bg-muted px-3 py-2 rounded mt-1">
												hello@halycron.space
											</p>
										</div>

										<div>
											<span
												className="font-medium text-sm text-muted-foreground">Subject line:</span>
											<p className="text-lg bg-muted px-3 py-2 rounded mt-1">
												Account Deletion Request
											</p>
										</div>

										<div>
											<span className="font-medium text-sm text-muted-foreground">Required information:</span>
											<ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
												<li>Your registered email address</li>
												<li>Confirmation that you want to delete your account</li>
												<li>Any specific reasons (optional, helps us improve)</li>
											</ul>
										</div>
									</div>
								</div>

								<Button asChild className="w-full sm:w-auto">
									<a href="mailto:hello@halycron.space?subject=Account%20Deletion%20Request&body=Hi%20Halycron%20Team%2C%0A%0AI%20would%20like%20to%20delete%20my%20account%20and%20all%20associated%20data.%0A%0ARegistered%20email%3A%20%5BYour%20Email%20Here%5D%0A%0AThank%20you.">
										<Mail className="h-4 w-4 mr-2"/>
										Send Deletion Email
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<Badge variant="secondary" className="text-lg font-bold px-3 py-1">3</Badge>
								<CardTitle className="text-2xl">Confirmation & Processing</CardTitle>
							</div>
							<CardDescription>
								We'll process your request immediately upon receipt
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<p className="text-muted-foreground">
									Once we receive your deletion request from your registered email address, we will:
								</p>

								<div className="grid gap-4">
									<div className="flex items-start gap-3 p-4 border rounded-lg">
										<Clock className="h-5 w-5 text-primary mt-0.5"/>
										<div>
											<h4 className="font-medium">Immediate Processing</h4>
											<p className="text-sm text-muted-foreground">
												Your account and all associated data will be deleted immediately, no
												questions asked.
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3 p-4 border rounded-lg">
										<Trash2 className="h-5 w-5 text-destructive mt-0.5"/>
										<div>
											<h4 className="font-medium">Complete Data Removal</h4>
											<p className="text-sm text-muted-foreground">
												All photos, account settings, and personal data will be permanently
												deleted from our servers.
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3 p-4 border rounded-lg">
										<MessageCircle className="h-5 w-5 text-primary mt-0.5"/>
										<div>
											<h4 className="font-medium">Confirmation Email</h4>
											<p className="text-sm text-muted-foreground">
												You'll receive a confirmation email once the deletion is complete.
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Temporary System Notice */}
				<Alert className="mb-8">
					<AlertTriangle className="h-4 w-4"/>
					<AlertTitle>Temporary Process</AlertTitle>
					<AlertDescription>
						This email-based deletion process is temporary while we develop a self-service account deletion
						feature
						directly in your dashboard. We appreciate your patience as we work to improve the user
						experience.
					</AlertDescription>
				</Alert>

				{/* Contact & Support */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MessageCircle className="h-5 w-5"/>
							Need Help or Have Questions?
						</CardTitle>
						<CardDescription>
							We're here to assist you with any concerns about account deletion
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<p className="text-muted-foreground">
								If you have any questions about the deletion process or need assistance with your
								account,
								please don't hesitate to reach out to our support team.
							</p>

							<div className="flex flex-col sm:flex-row gap-3">
								<Button variant="outline" asChild>
									<a href="mailto:hello@halycron.space?subject=Account%20Deletion%20Questions">
										<Mail className="h-4 w-4 mr-2"/>
										Contact Support
									</a>
								</Button>

								<Button variant="ghost" asChild>
									<Link href="/app">
										← Return to Dashboard
									</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Footer Note */}
				<div className="text-center mt-12 pt-8 border-t">
					<p className="text-sm text-muted-foreground">
						We value your privacy and security. All deletion requests are processed securely and
						permanently.
					</p>
				</div>
			</div>
		</div>
	)
}

export default DeleteAccountPage
