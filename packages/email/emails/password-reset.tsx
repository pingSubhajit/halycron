import {Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text} from '@react-email/components'
import * as React from 'react'

const logoImage = process.env.NODE_ENV === 'production'
	? 'https://halycron.space/logo_dark.png'
	: 'http://localhost:3000/logo_dark.png' // For local development

interface PasswordResetProps {
	resetUrl: string
	userName?: string
}

export const PasswordReset = ({
	resetUrl,
	userName = 'there'
}: PasswordResetProps) => {
	return (
		<Html>
			<Head/>
			<Preview>Reset your Halycron password</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={headerSection}>
						<Img
							src={logoImage}
							width="140"
							alt="Halycron"
							style={logo}
						/>
					</Section>

					<Section style={contentCard}>
						<Text style={titleText}>Reset your password</Text>

						<Text style={bodyText}>
							Hi {userName}, we received a request to reset your <strong style={brandText}>Halycron</strong> password.
						</Text>

						<Text style={bodyText}>
							If this was you, tap the button below to set a new password. If not, you can safely ignore this email.
						</Text>

						<Section style={buttonContainer}>
							<Button style={ctaButton} href={resetUrl}>
								Reset Password
							</Button>
						</Section>

						<Text style={alternativeText}>
							If the button doesn't work, copy and paste this link into your browser:
						</Text>

						<Section style={linkContainer}>
							<Text style={linkText}>
								{resetUrl}
							</Text>
						</Section>

						<Hr style={divider}/>

						<Text style={footerText}>
							For your security, this link expires after a short time.
						</Text>

						<Text style={supportText}>
							Questions? We’re here at{' '}
							<Link href="mailto:hello@halycron.space" style={supportLink}>
								hello@halycron.space
							</Link>
						</Text>
					</Section>

					<Section style={brandingFooter}>
						<Text style={brandingText}>
							Secure • Private • Zero-Knowledge
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

export default PasswordReset

const main = {
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	backgroundColor: '#ffffff',
	padding: '20px 0'
}

const container = {
	backgroundColor: '#ffffff',
	margin: '0 auto',
	maxWidth: '600px',
	borderRadius: '8px',
	boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
}

const headerSection = {
	background: '#ffffff',
	padding: '24px 20px 0',
	textAlign: 'center' as const,
	borderTopLeftRadius: '8px',
	borderTopRightRadius: '8px'
}

const logo = {
	margin: '24px auto 0'
}

const contentCard = {
	marginTop: '0',
	backgroundColor: '#ffffff',
	padding: '48px'
}

const titleText = {
	color: '#111827',
	fontSize: '22px',
	fontWeight: '700',
	letterSpacing: '-0.01em',
	margin: '0 0 16px 0',
	textAlign: 'center' as const
}

const bodyText = {
	color: '#374151',
	fontSize: '16px',
	lineHeight: '1.6',
	margin: '0 0 20px 0'
}

const brandText = {
	color: '#00b793',
	fontWeight: '600'
}

const buttonContainer = {
	margin: '32px 0',
	textAlign: 'center' as const
}

const ctaButton = {
	border: '1px solid #00b793',
	color: '#00b793',
	display: 'inline-block',
	fontSize: '16px',
	fontWeight: '600',
	padding: '16px 32px',
	textDecoration: 'none',
	textAlign: 'center' as const
}

const alternativeText = {
	color: '#6b7280',
	fontSize: '14px',
	margin: '32px 0 12px 0',
	textAlign: 'center' as const
}

const linkContainer = {
	backgroundColor: '#f3f4f6',
	border: '1px solid #e5e7eb',
	borderRadius: '6px',
	margin: '0 0 32px 0',
	padding: '16px'
}

const linkText = {
	color: '#00b793',
	fontFamily: 'monospace',
	fontSize: '13px',
	lineHeight: '1.4',
	margin: '0',
	wordBreak: 'break-all' as const,
	textAlign: 'center' as const
}

const divider = {
	border: 'none',
	borderTop: '1px solid #e5e7eb',
	margin: '32px 0'
}

const footerText = {
	color: '#6b7280',
	fontSize: '14px',
	lineHeight: '1.5',
	margin: '0 0 4px 0',
	textAlign: 'center' as const
}

const supportText = {
	color: '#6b7280',
	fontSize: '14px',
	lineHeight: '1.5',
	margin: '24px 0 0 0',
	textAlign: 'center' as const
}

const supportLink = {
	color: '#00b793',
	textDecoration: 'none'
}

const brandingFooter = {
	borderTop: '1px solid #e5e7eb',
	marginTop: '32px',
	paddingTop: '24px',
	paddingBottom: '24px',
	textAlign: 'center' as const
}

const brandingText = {
	color: '#9ca3af',
	fontSize: '12px',
	fontWeight: '500',
	letterSpacing: '0.5px',
	margin: '0',
	textTransform: 'uppercase' as const
}

