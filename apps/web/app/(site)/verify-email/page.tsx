'use client'

import {useEffect, useState} from 'react'
import {useSearchParams} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {CheckCircle, Loader2, Mail, XCircle} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@halycron/ui/media/logo.svg'
import {motion} from 'motion/react'

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired'

export default () => {
	const searchParams = useSearchParams()
	const [status, setStatus] = useState<VerificationStatus>('loading')
	const [message, setMessage] = useState('')

	useEffect(() => {
		const token = searchParams.get('token')
		const email = searchParams.get('email')

		if (!token || !email) {
			setStatus('error')
			setMessage('Invalid verification link. Please check your email for the correct link.')
			return
		}

		const verifyEmail = async () => {
			try {
				const response = await fetch('/api/auth/verify-email', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({token, email})
				})

				const data = await response.json()

				if (response.ok && data.success) {
					setStatus('success')
					setMessage('Your email has been verified successfully! You can now access all features.')
				} else if (data.error === 'Token expired') {
					setStatus('expired')
					setMessage('This verification link has expired. Please request a new one.')
				} else {
					setStatus('error')
					setMessage(data.error || 'Failed to verify email. Please try again.')
				}
			} catch (error) {
				console.error('Verification error:', error)
				setStatus('error')
				setMessage('Something went wrong. Please try again later.')
			}
		}

		verifyEmail()
	}, [searchParams])

	const getIcon = () => {
		switch (status) {
		case 'loading':
			return <Loader2 className="h-16 w-16 text-primary animate-spin"/>
		case 'success':
			return <CheckCircle className="h-16 w-16 text-green-500"/>
		case 'error':
		case 'expired':
			return <XCircle className="h-16 w-16 text-red-500"/>
		}
	}

	const getTitle = () => {
		switch (status) {
		case 'loading':
			return 'Verifying your email...'
		case 'success':
			return 'Email verified!'
		case 'expired':
			return 'Link expired'
		case 'error':
			return 'Verification failed'
		}
	}

	const handleResendVerification = async () => {
		try {
			const response = await fetch('/api/auth/send-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				setMessage('A new verification email has been sent to your inbox.')
			} else {
				setMessage('Failed to send verification email. Please try again.')
			}
		} catch (error) {
			setMessage('Something went wrong. Please try again later.')
		}
	}

	return (
		<div
			className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
			<motion.div
				initial={{opacity: 0, y: 20}}
				animate={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				className="w-full max-w-md"
			>
				<div className="flex flex-col items-center mb-8">
					<Link href="/">
						<Image src={logo} alt="Halycron Logo" className="w-32 mb-4"/>
					</Link>
				</div>

				<Card>
					<CardHeader>
						<div className="flex flex-col items-center space-y-4">
							{getIcon()}
							<CardTitle className="text-2xl text-center">{getTitle()}</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<CardDescription className="text-base">
							{message}
						</CardDescription>

						{status === 'success' && (
							<div className="space-y-3">
								<Button asChild className="w-full">
									<Link href="/app">
										Go to Dashboard
									</Link>
								</Button>
								<Button variant="outline" asChild className="w-full">
									<Link href="/login">
										Sign In
									</Link>
								</Button>
							</div>
						)}

						{status === 'expired' && (
							<div className="space-y-3">
								<Button onClick={handleResendVerification} className="w-full">
									<Mail className="h-4 w-4 mr-2"/>
									Send New Verification Email
								</Button>
								<Button variant="outline" asChild className="w-full">
									<Link href="/login">
										Back to Sign In
									</Link>
								</Button>
							</div>
						)}

						{status === 'error' && (
							<div className="space-y-3">
								<Button variant="outline" asChild className="w-full">
									<Link href="/login">
										Back to Sign In
									</Link>
								</Button>
							</div>
						)}

						{status === 'loading' && (
							<div className="text-sm text-muted-foreground">
								Please wait while we verify your email address...
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	)
}
