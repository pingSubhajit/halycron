'use client'

import {useMemo, useState} from 'react'
import {useVault} from '@/components/vault-provider'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Input} from '@halycron/ui/components/input'
import {toast} from 'sonner'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'

export const VaultGate = ({children}: {children: React.ReactNode}) => {
	const {status, lastError, unlockWithPassword, recoverWithRecoveryKey, bootstrap} = useVault()
	const [password, setPassword] = useState('')
	const [recoveryKey, setRecoveryKey] = useState('')
	const [isBusy, setIsBusy] = useState(false)
	const [showRecovery, setShowRecovery] = useState(false)
	const [bootstrapKey, setBootstrapKey] = useState<string | null>(null)

	const title = useMemo(() => {
		if (status === 'checking') return 'Unlocking your vault...'
		if (status === 'not_initialized') return 'Set up zero‑knowledge encryption'
		return 'Vault locked'
	}, [status])

	// Minimal, sleek loading state (match gallery skeleton vibe).
	if (status === 'checking') {
		return (
			<div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
				<div className="w-full max-w-sm space-y-4">
					<div className="space-y-2">
						<div className="h-3 w-28 rounded bg-accent animate-pulse" />
						<div className="h-2 w-64 rounded bg-accent/70 animate-pulse" />
					</div>
					<TextShimmer duration={1.2} className="text-sm text-muted-foreground">
						Unlocking…
					</TextShimmer>
				</div>
			</div>
		)
	}

	// Important: even if bootstrap unlocks the vault, we must show the Recovery Key once.
	if (bootstrapKey) {
		return (
			<div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
				<Card className="w-full max-w-lg">
					<CardHeader>
						<CardTitle>Your Recovery Key (save this now)</CardTitle>
						<CardDescription>
							We cannot recover this for you. You will need it to restore access after a password reset.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-md border p-3 font-mono text-sm break-all select-all">
							{bootstrapKey}
						</div>
						<Button className="w-full" onClick={() => setBootstrapKey(null)}>
							I saved it, continue
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (status === 'unlocked') return <>{children}</>

	const handleUnlock = async () => {
		try {
			setIsBusy(true)
			const result = await unlockWithPassword(password)
			if (result.status === 'needs_recovery') {
				setShowRecovery(true)
				toast.error('Can’t unlock with password. If you recently reset your password, use your Recovery Key.')
			}
		} finally {
			setIsBusy(false)
		}
	}

	const handleRecover = async () => {
		try {
			setIsBusy(true)
			await recoverWithRecoveryKey(recoveryKey, password)
		} finally {
			setIsBusy(false)
		}
	}

	const handleBootstrap = async () => {
		try {
			setIsBusy(true)
			const {recoveryKey: rk} = await bootstrap(password)
			setBootstrapKey(rk)
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>
						{status === 'not_initialized'
							? 'To protect photos and filenames, we’ll generate a master key on this device and give you a Recovery Key.'
							: 'Enter your password to unlock your encrypted photos on this device.'}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{lastError && (
						<div className="text-sm text-destructive">{lastError}</div>
					)}

					<>
							<div className="space-y-2">
								<label className="text-sm font-medium">Password</label>
								<Input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									autoComplete="current-password"
								/>
							</div>

							{status === 'not_initialized' ? (
								<Button className="w-full" onClick={handleBootstrap} disabled={isBusy || !password}>
									{isBusy ? 'Setting up...' : 'Set up encryption'}
								</Button>
							) : (
								<Button className="w-full" onClick={handleUnlock} disabled={isBusy || !password}>
									{isBusy ? 'Unlocking...' : 'Unlock vault'}
								</Button>
							)}

							{(status !== 'not_initialized') && (
								<div className="space-y-3">
									<Button
										variant="outline"
										className="w-full"
										onClick={() => setShowRecovery(v => !v)}
									>
										Use Recovery Key
									</Button>

									{showRecovery && (
										<div className="space-y-2">
											<label className="text-sm font-medium">Recovery Key</label>
											<Input
												value={recoveryKey}
												onChange={(e) => setRecoveryKey(e.target.value)}
												placeholder="Paste your Recovery Key"
												autoComplete="off"
											/>
											<Button className="w-full" onClick={handleRecover} disabled={isBusy || !password || !recoveryKey}>
												{isBusy ? 'Recovering...' : 'Recover and unlock'}
											</Button>
										</div>
									)}
								</div>
							)}
					</>
				</CardContent>
			</Card>
		</div>
	)
}


