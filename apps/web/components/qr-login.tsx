'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Loader2, RefreshCw, Smartphone, CheckCircle2} from 'lucide-react'
import QRCode from 'qrcode'

type QrLoginState = 'loading' | 'displaying' | 'approved' | 'expired' | 'error'

interface QrLoginInitiateResponse {
	token: string
	expiresAt: string
	qrData: string
}

interface QrLoginStatusResponse {
	status: 'pending' | 'approved' | 'expired' | 'cancelled'
	remainingMs?: number
	oneTimeToken?: string
}

interface QrLoginProps {
	onSuccess: () => void
	onCancel: () => void
}

export const QrLogin = ({onSuccess, onCancel}: QrLoginProps) => {
	const [state, setState] = useState<QrLoginState>('loading')
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
	const [token, setToken] = useState<string | null>(null)
	const [remainingTime, setRemainingTime] = useState<number>(180000) // 3 minutes default
	const [error, setError] = useState<string | null>(null)
	
	const pollingRef = useRef<NodeJS.Timeout | null>(null)
	const countdownRef = useRef<NodeJS.Timeout | null>(null)
	const expiresAtRef = useRef<number>(0)
	const isInitializedRef = useRef(false)
	const isVerifyingRef = useRef(false)

	// Clean up intervals
	const cleanup = useCallback(() => {
		if (pollingRef.current) {
			clearInterval(pollingRef.current)
			pollingRef.current = null
		}
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

	// Initialize QR login
	const initializeQrLogin = useCallback(async (isManualRefresh = false) => {
		// Prevent double initialization on mount
		if (!isManualRefresh && isInitializedRef.current) {
			return
		}
		isInitializedRef.current = true
		isVerifyingRef.current = false // Reset for new session
		
		cleanup()
		setState('loading')
		setError(null)
		setQrDataUrl(null)

		try {
			const response = await fetch('/api/auth/qr-login/initiate', {
				method: 'POST'
			})

			if (!response.ok) {
				throw new Error('Failed to initiate QR login')
			}

			const data: QrLoginInitiateResponse = await response.json()
			
			setToken(data.token)
			await generateQrImage(data.qrData)
			
			// Store expiration time in ref for accurate countdown
			expiresAtRef.current = new Date(data.expiresAt).getTime()
			const remaining = Math.max(0, expiresAtRef.current - Date.now())
			setRemainingTime(remaining)
			
			setState('displaying')

			// Start countdown timer - calculate from stored expiration time
			countdownRef.current = setInterval(() => {
				const newRemaining = Math.max(0, expiresAtRef.current - Date.now())
				setRemainingTime(newRemaining)
				
				if (newRemaining <= 0) {
					cleanup()
					setState('expired')
				}
			}, 1000)

			// Start polling for status
			pollingRef.current = setInterval(async () => {
				// Skip if we're already verifying
				if (isVerifyingRef.current) return
				
				try {
					const statusResponse = await fetch(`/api/auth/qr-login/status/${data.token}`)
					
					if (!statusResponse.ok) {
						return
					}

					const statusData: QrLoginStatusResponse = await statusResponse.json()

					if (statusData.status === 'approved') {
						// Stop polling immediately
						cleanup()
						
						// If we already started verifying, skip
						if (isVerifyingRef.current) return
						
						// If no token, a previous poll already got it - just wait
						if (!statusData.oneTimeToken) {
							return
						}
						
						isVerifyingRef.current = true
						setState('approved')
						
						// Exchange the one-time token for a proper session using better-auth plugin
						try {
							const exchangeResponse = await fetch('/api/auth/qr-login/plugin-exchange', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									exchangeToken: statusData.oneTimeToken
								}),
								credentials: 'include' // Important: include cookies for the session to be set
							})

							if (!exchangeResponse.ok) {
								const errorData = await exchangeResponse.json().catch(() => ({}))
								throw new Error(errorData.message || errorData.error || 'Failed to complete login')
							}

							// Session cookie is now set by better-auth
							// Small delay for UX, then redirect
							setTimeout(() => {
								onSuccess()
							}, 1500)
						} catch (verifyErr) {
							console.error('Error exchanging token:', verifyErr)
							setError(verifyErr instanceof Error ? verifyErr.message : 'Failed to complete login')
							setState('error')
							isVerifyingRef.current = false
						}
					} else if (statusData.status === 'expired' || statusData.status === 'cancelled') {
						cleanup()
						setState('expired')
					}
				} catch (err) {
					console.error('Error polling status:', err)
				}
			}, 2000)

		} catch (err) {
			console.error('Error initializing QR login:', err)
			setError('Failed to initialize QR login')
			setState('error')
		}
	}, [cleanup, onSuccess])

	// Initialize on mount only once
	useEffect(() => {
		initializeQrLogin(false)
		return cleanup
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Cancel the QR login request on unmount
	useEffect(() => {
		return () => {
			if (token) {
				fetch(`/api/auth/qr-login/cancel/${token}`, {method: 'POST'}).catch(() => {})
			}
		}
	}, [token])

	// Format remaining time as MM:SS
	const formatTime = (ms: number) => {
		const seconds = Math.ceil(ms / 1000)
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="flex items-center justify-center gap-2">
					<Smartphone className="h-5 w-5" />
					Login with Mobile App
				</CardTitle>
				<CardDescription>
					{state === 'loading' && 'Generating QR code...'}
					{state === 'displaying' && 'Scan this QR code with your Halycron mobile app'}
					{state === 'approved' && 'Login approved!'}
					{state === 'expired' && 'QR code expired'}
					{state === 'error' && 'Something went wrong'}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center space-y-4">
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
								alt="QR Code for login" 
								className="w-56 h-56"
							/>
						</div>
						<div className="text-center">
							<p className="text-sm text-muted-foreground">
								Expires in <span className="font-mono font-medium text-foreground">{formatTime(remainingTime)}</span>
							</p>
						</div>
					</>
				)}

				{state === 'approved' && (
					<div className="w-64 h-64 flex flex-col items-center justify-center bg-transparent rounded-lg">
						<CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
						<p className="text-green-500 font-medium">Redirecting...</p>
					</div>
				)}

				{state === 'expired' && (
					<div className="w-64 h-64 flex flex-col items-center justify-center bg-transparent rounded-lg space-y-4">
						<p className="text-muted-foreground">QR code has expired</p>
						<Button onClick={() => initializeQrLogin(true)} variant="outline" size="sm">
							<RefreshCw className="h-4 w-4 mr-2" />
							Generate new code
						</Button>
					</div>
				)}

				{state === 'error' && (
					<div className="w-64 h-64 flex flex-col items-center justify-center bg-transparent rounded-lg space-y-4">
						<p className="text-destructive text-sm text-center px-4">{error}</p>
						<Button onClick={() => initializeQrLogin(true)} variant="outline" size="sm">
							<RefreshCw className="h-4 w-4 mr-2" />
							Try again
						</Button>
					</div>
				)}

				<div className="w-full pt-4 border-t">
					<Button
						variant="ghost"
						onClick={onCancel}
						className="w-full"
					>
						Use email and password instead
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}

