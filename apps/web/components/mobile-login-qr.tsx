'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@halycron/ui/components/dialog'
import {Button} from '@halycron/ui/components/button'
import {Loader2, RefreshCw, Smartphone} from 'lucide-react'
import QRCode from 'qrcode'

type MobileLoginState = 'loading' | 'displaying' | 'expired' | 'error'

interface MobileLoginQrProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

interface MobileLoginInitiateResponse {
	token: string
	expiresAt: string
	qrData: string
}

export const MobileLoginQr = ({open, onOpenChange}: MobileLoginQrProps) => {
	const [state, setState] = useState<MobileLoginState>('loading')
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
	const [remainingTime, setRemainingTime] = useState<number>(180000) // 3 minutes default
	const [error, setError] = useState<string | null>(null)

	const countdownRef = useRef<NodeJS.Timeout | null>(null)
	const expiresAtRef = useRef<number>(0)
	const isInitializedRef = useRef(false)

	// Clean up intervals
	const cleanup = useCallback(() => {
		if (countdownRef.current) {
			clearInterval(countdownRef.current)
			countdownRef.current = null
		}
	}, [])

	// Generate QR code image from data
	const generateQrImage = async (data: string) => {
		try {
			const dataUrl = await QRCode.toDataURL(data, {
				width: 256,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			})
			setQrDataUrl(dataUrl)
		} catch (err) {
			console.error('Error generating QR code:', err)
			setError('Failed to generate QR code')
			setState('error')
		}
	}

	// Initialize mobile login QR
	const initializeMobileLogin = useCallback(async (isManualRefresh = false) => {
		if (!isManualRefresh && isInitializedRef.current) {
			return
		}
		isInitializedRef.current = true

		cleanup()
		setState('loading')
		setError(null)
		setQrDataUrl(null)

		try {
			const response = await fetch('/api/auth/qr-login/initiate-mobile', {
				method: 'POST',
				credentials: 'include'
			})

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error('You must be logged in to generate a mobile login QR code')
				}
				throw new Error('Failed to initiate mobile login')
			}

			const data: MobileLoginInitiateResponse = await response.json()

			await generateQrImage(data.qrData)

			// Store expiration time in ref for accurate countdown
			expiresAtRef.current = new Date(data.expiresAt).getTime()
			const remaining = Math.max(0, expiresAtRef.current - Date.now())
			setRemainingTime(remaining)

			setState('displaying')

			// Start countdown timer
			countdownRef.current = setInterval(() => {
				const newRemaining = Math.max(0, expiresAtRef.current - Date.now())
				setRemainingTime(newRemaining)

				if (newRemaining <= 0) {
					cleanup()
					setState('expired')
				}
			}, 1000)

		} catch (err) {
			console.error('Error initializing mobile login:', err)
			setError(err instanceof Error ? err.message : 'Failed to initialize mobile login')
			setState('error')
		}
	}, [cleanup])

	// Initialize when dialog opens
	useEffect(() => {
		if (open) {
			isInitializedRef.current = false
			initializeMobileLogin(false)
		} else {
			cleanup()
			setState('loading')
			setQrDataUrl(null)
			setError(null)
			isInitializedRef.current = false
		}

		return cleanup
	}, [open, initializeMobileLogin, cleanup])

	// Format remaining time as MM:SS
	const formatTime = (ms: number) => {
		const seconds = Math.ceil(ms / 1000)
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Smartphone className="h-5 w-5" />
						Login to Mobile Device
					</DialogTitle>
					<DialogDescription>
						{state === 'loading' && 'Generating QR code...'}
						{state === 'displaying' && 'Scan this QR code on the mobile app login screen'}
						{state === 'expired' && 'QR code expired'}
						{state === 'error' && 'Something went wrong'}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center space-y-4 py-4">
					{state === 'loading' && (
						<div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					)}

					{state === 'displaying' && qrDataUrl && (
						<>
							<div className="p-4 bg-white rounded-lg">
								<img
									src={qrDataUrl}
									alt="QR Code for mobile login"
									className="w-56 h-56"
								/>
							</div>
							<div className="text-center">
								<p className="text-sm text-muted-foreground">
									Expires in <span className="font-mono font-medium text-foreground">{formatTime(remainingTime)}</span>
								</p>
								<p className="text-xs text-muted-foreground mt-2">
									Open the Halycron mobile app and tap &quot;Scan QR to login&quot; on the login screen
								</p>
							</div>
						</>
					)}

					{state === 'expired' && (
						<div className="w-64 h-64 flex flex-col items-center justify-center bg-transparent rounded-lg space-y-4">
							<p className="text-muted-foreground">QR code has expired</p>
							<Button onClick={() => initializeMobileLogin(true)} variant="outline" size="sm">
								<RefreshCw className="h-4 w-4 mr-2" />
								Generate new code
							</Button>
						</div>
					)}

					{state === 'error' && (
						<div className="w-64 h-64 flex flex-col items-center justify-center bg-transparent rounded-lg space-y-4">
							<p className="text-destructive text-sm text-center px-4">{error}</p>
							<Button onClick={() => initializeMobileLogin(true)} variant="outline" size="sm">
								<RefreshCw className="h-4 w-4 mr-2" />
								Try again
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}

