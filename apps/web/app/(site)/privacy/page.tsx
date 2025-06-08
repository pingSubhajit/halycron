import Link from 'next/link'
import {Button} from '@halycron/ui/components/button'

export default () => (
	<div className="min-h-screen bg-background pt-24">
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="space-y-8">
				{/* Header */}
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
					<p className="text-lg text-muted-foreground">
						Last updated: {new Date().toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</p>
				</div>

				{/* Introduction */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Introduction</h2>
					<p className="text-muted-foreground">
						At Halycron, your privacy is our top priority. This Privacy Policy explains how we collect,
						use, process, and protect your information when you use our secure photo vault service.
						Halycron is designed with a "zero-knowledge" architecture where your photos are encrypted
						end-to-end, meaning we cannot access your photos or their content.
					</p>
				</section>

				{/* Information We Collect */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Information We Collect</h2>

					<div className="space-y-4">
						<h3 className="text-xl font-medium">Account Information</h3>
						<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
							<li><strong>Email Address:</strong> Used for account creation, authentication, and important
								security notifications
							</li>
							<li><strong>Name:</strong> Used to personalize your experience and for account
								identification
							</li>
							<li><strong>Profile Image:</strong> Optional profile picture you may choose to upload</li>
							<li><strong>Password Hash:</strong> Securely hashed version of your password (we never store
								your actual password)
							</li>
							<li><strong>Two-Factor Authentication Data:</strong> Secret keys and backup codes for
								enhanced security
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h3 className="text-xl font-medium">Session and Security Information</h3>
						<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
							<li><strong>IP Address:</strong> Used for security monitoring and rate limiting</li>
							<li><strong>User Agent:</strong> Browser and device information for security analysis</li>
							<li><strong>Login Timestamps:</strong> When you access your account for security monitoring
							</li>
							<li><strong>Session Tokens:</strong> Secure tokens that authenticate your logged-in sessions
							</li>
							<li><strong>Failed Login Attempts:</strong> Tracked to protect against unauthorized access
								attempts
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h3 className="text-xl font-medium">Photo and Media Information</h3>
						<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
							<li><strong>Encrypted Photo Files:</strong> Your photos encrypted with AES-256 encryption
								before being stored
							</li>
							<li><strong>File Metadata:</strong> Original filename, file type, image dimensions (all
								encrypted)
							</li>
							<li><strong>Upload Timestamps:</strong> When photos were added to your vault</li>
							<li><strong>Album Organization:</strong> How you organize your photos into albums</li>
							<li><strong>Sharing Information:</strong> Links and permissions for photos you choose to
								share
							</li>
						</ul>
					</div>
				</section>

				{/* How We Use Your Information */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">How We Use Your Information</h2>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li><strong>Service Provision:</strong> To provide secure photo storage and management services
						</li>
						<li><strong>Authentication:</strong> To verify your identity and maintain secure access to your
							account
						</li>
						<li><strong>Security:</strong> To protect your account from unauthorized access and security
							threats
						</li>
						<li><strong>Communication:</strong> To send important security alerts and service updates</li>
						<li><strong>Technical Support:</strong> To assist you with any issues or questions about the
							service
						</li>
						<li><strong>Service Improvement:</strong> To improve our security measures and user experience
							(using anonymized data only)
						</li>
					</ul>
				</section>

				{/* Our Zero-Knowledge Architecture */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Our Zero-Knowledge Architecture</h2>
					<div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg space-y-4">
						<h3 className="text-xl font-medium text-blue-900 dark:text-blue-100">End-to-End Encryption</h3>
						<ul className="list-disc pl-6 space-y-2 text-blue-800 dark:text-blue-200">
							<li>All photos are encrypted on your device using AES-256-CBC encryption before upload</li>
							<li>Each photo has its own unique encryption key</li>
							<li>Encryption keys are encrypted with your master key before being stored</li>
							<li>We cannot decrypt or view your photos - only you have access to them</li>
							<li>Photo metadata is also encrypted before storage</li>
						</ul>
					</div>
				</section>

				{/* Data Storage and Security */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Data Storage and Security</h2>
					<div className="space-y-4">
						<h3 className="text-xl font-medium">Storage Infrastructure</h3>
						<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
							<li><strong>AWS S3:</strong> Encrypted photos are stored in Amazon S3 with server-side
								encryption (AES-256)
							</li>
							<li><strong>PostgreSQL Database:</strong> Account information and encrypted metadata are
								stored in a secure database
							</li>
							<li><strong>Redis Cache:</strong> Temporary session data for improved performance and rate
								limiting
							</li>
							<li><strong>Geographic Location:</strong> Data is stored in secure data centers with
								appropriate jurisdictional protections
							</li>
						</ul>

						<h3 className="text-xl font-medium">Security Measures</h3>
						<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
							<li>Multi-factor authentication required for all accounts</li>
							<li>Rate limiting to prevent abuse and brute force attacks</li>
							<li>Regular security audits and monitoring</li>
							<li>Secure session management with automatic expiration</li>
							<li>HTTPS encryption for all data transmission</li>
						</ul>
					</div>
				</section>

				{/* Data Sharing and Third Parties */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Data Sharing and Third Parties</h2>
					<div className="space-y-4">
						<h3 className="text-xl font-medium">We Do Not Sell Your Data</h3>
						<p className="text-muted-foreground">
							We never sell, rent, or trade your personal information to third parties for marketing
							purposes.
						</p>

						<h3 className="text-xl font-medium">Service Providers</h3>
						<p className="text-muted-foreground">
							We work with trusted service providers who help us operate our service:
						</p>
						<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
							<li><strong>Amazon Web Services (AWS):</strong> For secure cloud storage of encrypted photos
							</li>
							<li><strong>Database Providers:</strong> For storing encrypted metadata and account
								information
							</li>
							<li><strong>Security Services:</strong> For monitoring and protecting against threats</li>
						</ul>
						<p className="text-muted-foreground">
							These providers are bound by strict data protection agreements and cannot access your
							encrypted photos.
						</p>

						<h3 className="text-xl font-medium">Legal Requirements</h3>
						<p className="text-muted-foreground">
							We may disclose information if required by law, but due to our zero-knowledge architecture,
							we cannot provide access to your encrypted photos even if legally compelled to do so.
						</p>
					</div>
				</section>

				{/* Your Rights and Controls */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Your Rights and Controls</h2>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li><strong>Data Access:</strong> You can access all your data through your account dashboard
						</li>
						<li><strong>Data Export:</strong> You can download all your photos and data at any time</li>
						<li><strong>Data Deletion:</strong> You can delete individual photos or your entire account</li>
						<li><strong>Privacy Controls:</strong> You control who can access your shared photos and albums
						</li>
						<li><strong>Account Security:</strong> You can review and manage your active sessions</li>
						<li><strong>Communication Preferences:</strong> You can control what notifications you receive
						</li>
					</ul>
				</section>

				{/* Data Retention */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Data Retention</h2>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li><strong>Active Accounts:</strong> We retain your data as long as your account is active</li>
						<li><strong>Account Deletion:</strong> When you delete your account, we permanently delete all
							associated data within 30 days
						</li>
						<li><strong>Session Data:</strong> Session information is automatically deleted after expiration
						</li>
						<li><strong>Shared Links:</strong> Expired shared links and their access logs are automatically
							cleaned up
						</li>
						<li><strong>Backup Systems:</strong> Data may persist in backup systems for up to 90 days after
							deletion for disaster recovery purposes
						</li>
					</ul>
				</section>

				{/* International Data Transfers */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">International Data Transfers</h2>
					<p className="text-muted-foreground">
						Your data may be transferred to and processed in countries other than your own. We ensure
						appropriate safeguards are in place, including:
					</p>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li>End-to-end encryption that protects your data regardless of location</li>
						<li>Compliance with applicable data protection laws</li>
						<li>Contractual protections with our service providers</li>
						<li>Regular security assessments of our infrastructure</li>
					</ul>
				</section>

				{/* Changes to This Policy */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Changes to This Privacy Policy</h2>
					<p className="text-muted-foreground">
						We may update this Privacy Policy from time to time. When we make changes:
					</p>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li>We will update the "Last updated" date at the top of this policy</li>
						<li>We will notify you of significant changes via email or in-app notification</li>
						<li>Your continued use of the service constitutes acceptance of the updated policy</li>
						<li>We will maintain previous versions for your reference</li>
					</ul>
				</section>

				{/* Contact Information */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">Contact Us</h2>
					<p className="text-muted-foreground">
						If you have any questions about this Privacy Policy or our privacy practices, please contact us:
					</p>
					<div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
						<ul className="space-y-2 text-muted-foreground">
							<li><strong>Email:</strong> hello@halycron.space</li>
							<li><strong>Subject Line:</strong> Privacy Policy Inquiry</li>
							<li><strong>Response Time:</strong> We aim to respond within 48 hours</li>
						</ul>
					</div>
				</section>

				{/* Back to Home */}
				<div className="text-center pt-8">
					<Button asChild>
						<Link href="/">
							Back to Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	</div>
)
