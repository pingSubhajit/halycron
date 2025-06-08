import {Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text} from '@react-email/components'
import * as React from 'react'

const logoImage = process.env.NODE_ENV === 'production'
	? 'https://halycron.space/logo_dark.png'
	: 'http://localhost:3000/logo_dark.png' // For local development

interface ExportReadyProps {
	downloadUrl: string
	userName?: string
	totalPhotos: number
	expiresAt: string
}

export const ExportReady = ({
								downloadUrl,
								userName = 'there',
								totalPhotos,
								expiresAt
							}: ExportReadyProps) => {
	const formatExpiryDate = (dateString: string) => {
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		} catch {
			return '7 days'
		}
	}

	return (
		<Html>
			<Head/>
			<Preview>Your Halycron data export is ready for download</Preview>
			<Body style={main}>
				<Container style={container}>
					{/* Header with gradient background */}
					<Section style={headerSection}>
						<Img
							src={logoImage}
							width="140"
							alt="Halycron"
							style={logo}
						/>
					</Section>

					{/* Main content card */}
					<Section style={contentCard}>
						<Text style={bodyText}>
							Hi {userName}, your <strong style={brandText}>Halycron</strong> data export has been
							completed successfully and is ready for download.
						</Text>

						<Text style={bodyText}>
							Your export contains <strong>{totalPhotos} photos</strong> along with all your albums,
							metadata, and shared links in an encrypted format.
						</Text>

						{/* Export contents info */}
						<Section style={infoBox}>
							<Text style={infoTitle}>📦 What's included in your export:</Text>
							<Text style={infoList}>
								• All {totalPhotos} encrypted photos with decryption keys<br/>
								• Album structure and relationships<br/>
								• Photo metadata and EXIF data<br/>
								• Shared links information<br/>
								• Web-based decryption tool<br/>
								• Complete setup instructions
							</Text>
						</Section>

						{/* CTA Button */}
						<Section style={buttonContainer}>
							<Button style={ctaButton} href={downloadUrl}>
								Download Your Export
							</Button>
						</Section>

						{/* Security notice */}
						<Section style={securityBox}>
							<Text style={securityTitle}>🔐 Security Notice</Text>
							<Text style={securityText}>
								Your photos remain <strong>encrypted</strong> in this export for maximum security.
								Use the included decryption tool to access your photos.
							</Text>
						</Section>

						<Hr style={divider}/>

						{/* Important information */}
						<Text style={warningTitle}>⚠️ Important Information</Text>

						<Text style={bodyText}>
							<strong>Download Expires:</strong> {formatExpiryDate(expiresAt)}
						</Text>

						<Text style={bodyText}>
							<strong>Keep It Secure:</strong> Store this export in a secure location and don't share the
							download link.
						</Text>

						{/* Alternative link */}
						<Text style={alternativeText}>
							If the button doesn't work, copy and paste this link into your browser:
						</Text>

						<Section style={linkContainer}>
							<Text style={linkText}>
								{downloadUrl}
							</Text>
						</Section>

						<Text style={supportText}>
							Need help with your export? Contact us at{" "}
							<Link href="mailto:hello@halycron.space" style={supportLink}>
								hello@halycron.space
							</Link>
						</Text>
					</Section>

					{/* Bottom branding */}
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

export default ExportReady

// Styles with light theme and modern design
const main = {
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	backgroundColor: "#f9fafb",
	padding: "20px 0",
}

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	maxWidth: "600px",
	borderRadius: "8px",
	boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
}

const headerSection = {
	background: "#ffffff",
	padding: "24px 20px 0",
	textAlign: "center" as const,
	borderTopLeftRadius: "8px",
	borderTopRightRadius: "8px",
}

const logo = {
	margin: "24px auto 0",
}

const contentCard = {
	marginTop: "0",
	backgroundColor: "#ffffff",
	padding: "48px",
}

const bodyText = {
	color: "#374151",
	fontSize: "16px",
	lineHeight: "1.6",
	margin: "0 0 20px 0",
}

const brandText = {
	color: "#00b793", // Primary teal
	fontWeight: "600",
}

const infoBox = {
	backgroundColor: "#f3f4f6",
	border: "1px solid #e5e7eb",
	margin: "24px 0",
	padding: "20px",
}

const infoTitle = {
	color: "#00b793",
	fontSize: "16px",
	fontWeight: "600",
	margin: "0 0 12px 0",
}

const infoList = {
	color: "#374151",
	fontSize: "14px",
	lineHeight: "1.6",
	margin: "0",
}

const securityBox = {
	backgroundColor: "#eff6ff",
	border: "1px solid #3b82f6",
	margin: "24px 0",
	padding: "20px",
}

const securityTitle = {
	color: "#2563eb",
	fontSize: "16px",
	fontWeight: "600",
	margin: "0 0 8px 0",
}

const securityText = {
	color: "#374151",
	fontSize: "14px",
	lineHeight: "1.5",
	margin: "0",
}

const buttonContainer = {
	margin: "32px 0",
	textAlign: "center" as const,
}

const ctaButton = {
	border: "1px solid #00b793",
	color: "#00b793",
	display: "inline-block",
	fontSize: "16px",
	fontWeight: "600",
	padding: "16px 32px",
	textDecoration: "none",
	textAlign: "center" as const,
}

const warningTitle = {
	color: "#d97706",
	fontSize: "18px",
	fontWeight: "600",
	margin: "0 0 16px 0",
}

const alternativeText = {
	color: "#6b7280",
	fontSize: "14px",
	margin: "32px 0 12px 0",
	textAlign: "center" as const,
}

const linkContainer = {
	backgroundColor: "#f3f4f6",
	border: "1px solid #e5e7eb",
	margin: "0 0 32px 0",
	padding: "16px",
}

const linkText = {
	color: "#00b793",
	fontFamily: "monospace",
	fontSize: "13px",
	lineHeight: "1.4",
	margin: "0",
	wordBreak: "break-all" as const,
	textAlign: "center" as const,
}

const divider = {
	border: "none",
	borderTop: "1px solid #e5e7eb",
	margin: "32px 0",
}

const supportText = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "1.5",
	margin: "24px 0 0 0",
	textAlign: "center" as const,
}

const supportLink = {
	color: "#00b793",
	textDecoration: "none",
}

const brandingFooter = {
	borderTop: "1px solid #e5e7eb",
	marginTop: "32px",
	paddingTop: "24px",
	paddingBottom: "24px",
	textAlign: "center" as const,
}

const brandingText = {
	color: "#9ca3af",
	fontSize: "12px",
	fontWeight: "500",
	letterSpacing: "0.5px",
	margin: "0",
	textTransform: "uppercase" as const,
} 