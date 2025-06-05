import {Resend} from 'resend'
import {EmailVerification} from '@halycron/email/emails/email-verification'

let resendInstance: Resend | null = null

const getResendClient = () => {
	if (!resendInstance) {
		if (!process.env.RESEND_API_KEY) {
			throw new Error('RESEND_API_KEY environment variable is required')
		}
		resendInstance = new Resend(process.env.RESEND_API_KEY)
	}
	return resendInstance
}

interface SendVerificationEmailParams {
	to: string
	verificationUrl: string
	userName?: string
}

export const sendVerificationEmail = async ({
	to,
	verificationUrl,
	userName
}: SendVerificationEmailParams) => {
	try {
		const resend = getResendClient()

		const {data, error} = await resend.emails.send({
			from: 'Halycron <no-reply@halycron.space>',
			to: [to],
			subject: 'Verify your email address - Halycron',
			react: EmailVerification({
				verificationUrl,
				userName
			})
		})

		if (error) {
			console.error('Resend error:', error)
			throw new Error(`Failed to send verification email: ${error.message}`)
		}

		return {success: true, messageId: data?.id}
	} catch (error) {
		console.error('Email sending error:', error)
		throw error
	}
}
