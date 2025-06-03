import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import * as React from "react";

interface EmailVerificationProps {
	verificationUrl: string;
	userName?: string;
}

export const EmailVerification = ({
									  verificationUrl,
									  userName = "there",
								  }: EmailVerificationProps) => {
	return (
		<Html>
			<Head/>
			<Preview>Verify your email address to secure your Halycron account</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={logoContainer}>
						<Img
							src="https://halycron.space/logo.png"
							width="120"
							height="36"
							alt="Halycron"
							style={logo}
						/>
					</Section>

					<Heading style={h1}>Verify your email address</Heading>

					<Text style={heroText}>
						Hi {userName},
					</Text>

					<Text style={text}>
						Welcome to Halycron! We're excited to help you secure your precious memories.
						To get started, please verify your email address by clicking the button below.
					</Text>

					<Section style={buttonContainer}>
						<Button style={button} href={verificationUrl}>
							Verify Email Address
						</Button>
					</Section>

					<Text style={text}>
						If the button above doesn't work, you can also verify your email by copying
						and pasting the following link into your browser:
					</Text>

					<Text style={codeText}>
						{verificationUrl}
					</Text>

					<Hr style={hr}/>

					<Text style={footer}>
						This verification link will expire in 24 hours for security reasons.
						If you didn't create a Halycron account, please ignore this email.
					</Text>

					<Text style={footer}>
						Need help? Contact us at{" "}
						<Link href="mailto:hello@halycron.space" style={link}>
							hello@halycron.space
						</Link>
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default EmailVerification;

const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
};

const logoContainer = {
	margin: "32px 0",
	textAlign: "center" as const,
};

const logo = {
	margin: "0 auto",
};

const h1 = {
	color: "#333",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
	fontSize: "24px",
	fontWeight: "bold",
	margin: "40px 0",
	padding: "0",
	textAlign: "center" as const,
};

const heroText = {
	color: "#333",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
	fontSize: "18px",
	fontWeight: "600",
	margin: "0",
	padding: "0 48px",
};

const text = {
	color: "#333",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
	fontSize: "16px",
	lineHeight: "26px",
	margin: "16px 0",
	padding: "0 48px",
};

const buttonContainer = {
	margin: "32px 0",
	textAlign: "center" as const,
};

const button = {
	backgroundColor: "#000000",
	borderRadius: "8px",
	color: "#ffffff",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
	fontSize: "16px",
	fontWeight: "600",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	width: "200px",
	padding: "14px 0",
	margin: "0 auto",
};

const codeText = {
	backgroundColor: "#f4f4f4",
	borderRadius: "4px",
	color: "#333",
	fontFamily: "monospace",
	fontSize: "14px",
	margin: "16px 0",
	padding: "16px 48px",
	wordBreak: "break-all" as const,
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "40px 48px",
};

const footer = {
	color: "#8898aa",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
	fontSize: "14px",
	lineHeight: "24px",
	margin: "16px 0",
	padding: "0 48px",
};

const link = {
	color: "#556cd6",
};