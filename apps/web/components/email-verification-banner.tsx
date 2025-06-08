'use client'

import {useEffect, useState} from 'react'
import {Mail} from 'lucide-react'
import {Banner} from './banner'
import {authClient} from '@/lib/auth/auth-client'
import {useSendVerificationEmail} from '@/app/api/auth/mutations'
import {useStorageStats} from '@/app/api/storage/query'
import {AnimatePresence, motion} from 'motion/react'

export const EmailVerificationBanner = () => {
	const [isVisible, setIsVisible] = useState(true)
	const {data: session} = authClient.useSession()
	const {data: storageStats} = useStorageStats()
	const sendVerificationEmail = useSendVerificationEmail()

	// Only show banner if user is not verified and has photos
	const shouldShowBanner = session?.user && !session.user.emailVerified && (storageStats?.photos || 0) > 0 && isVisible

	// Handle hiding the banner (store in localStorage)
	const handleHide = () => {
		setIsVisible(false)
	}

	// Handle sending verification email
	const handleSendVerification = () => {
		sendVerificationEmail.mutate()
	}

	// Check if banner was previously dismissed on mount
	useEffect(() => {
		const wasDismissed = localStorage.getItem('email-verification-banner-dismissed') === 'true'
		if (wasDismissed) {
			setIsVisible(false)
		}
	}, [])

	// Reset banner visibility when user email verification status changes
	useEffect(() => {
		if (session?.user?.emailVerified) {
			localStorage.removeItem('email-verification-banner-dismissed')
		}
	}, [session?.user?.emailVerified])

	const photoCount = storageStats?.photos || 0

	// Determine the user's photo limit based on grandfathering policy
	const photoLimit = photoCount > 10 ? 50 : 10
	const isNearLimit = photoCount >= (photoLimit - 2) // Show when within 2 photos of limit

	// Generate appropriate title based on user's situation
	const getTitle = () => {
		if (photoLimit === 50) {
			// Grandfathered user with >10 photos
			if (isNearLimit) {
				return `You've uploaded ${photoCount}/50 photos. Verify your email for unlimited uploads!`
			}
			return 'You have a 50-photo limit. Verify your email to unlock unlimited uploads!'
		} else {
			// Regular user with ≤10 photos
			if (isNearLimit) {
				return `You've uploaded ${photoCount}/10 photos. Verify your email to upload more!`
			}
			return 'Verify your email to unlock unlimited photo uploads'
		}
	}

	return (
		<AnimatePresence mode="wait">
			{shouldShowBanner && (
				<motion.div
					key="email-verification-banner"
					initial={{height: 0, opacity: 0, marginBottom: 0}}
					animate={{
						height: 'auto',
						opacity: 1,
						marginBottom: 16,
						transition: {
							duration: 0.4,
							ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
						}
					}}
					exit={{
						height: 0,
						opacity: 0,
						marginBottom: 0,
						transition: {
							duration: 0.3,
							ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
						}
					}}
					style={{overflow: 'hidden'}}
				>
					<Banner
						show={true}
						onHide={handleHide}
						icon={<Mail className="h-4 w-4 stroke-dark"/>}
						title={getTitle()}
						action={{
							label: sendVerificationEmail.isPending ? 'Sending...' : 'Send Verification Email',
							onClick: handleSendVerification
						}}
						learnMoreUrl="/app/settings"
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
