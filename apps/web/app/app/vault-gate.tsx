'use client'

import {useMemo, useState} from 'react'
import {useVault} from '@/components/vault-provider'
import {Card, CardContent} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {Input} from '@halycron/ui/components/input'
import {toast} from 'sonner'
import {AnimatePresence, motion} from 'motion/react'
import {Lock, KeyRound, Terminal, ArrowRight, ArrowLeft, AlertTriangle} from 'lucide-react'

export const VaultGate = ({children}: {children: React.ReactNode}) => {
	const {status, lastError, unlockWithPassword, recoverWithRecoveryKey, bootstrap} = useVault()
	const [password, setPassword] = useState('')
	const [recoveryKey, setRecoveryKey] = useState('')
	const [isBusy, setIsBusy] = useState(false)
	const [view, setView] = useState<'main' | 'recovery'>('main')
	const [bootstrapKey, setBootstrapKey] = useState<string | null>(null)

	const title = useMemo(() => {
		if (status === 'checking') return 'Initializing System...'
		if (status === 'not_initialized') return 'Encryption Setup'
		return 'Vault Locked'
	}, [status])

	const handleUnlock = async () => {
		try {
			setIsBusy(true)
			const result = await unlockWithPassword(password)
			if (result.status === 'needs_recovery') {
				setView('recovery')
				toast.error('Access denied. Please use Recovery Key.')
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

	// Loading State
	if (status === 'checking') {
		return (
			<div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
				<div className="w-full max-w-sm space-y-4 text-center">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted animate-pulse">
						<Terminal className="w-6 h-6 text-primary" />
					</div>
					<div className="space-y-2">
						<div className="h-1 w-full bg-muted rounded overflow-hidden">
							<div className="h-full bg-primary w-2/3 animate-[shimmer_2s_infinite]" />
						</div>
						<p className="text-xs text-muted-foreground tracking-widest uppercase font-mono">
							Decrypting local storage...
						</p>
					</div>
				</div>
			</div>
		)
	}

	// Success/Unlocked State
	if (status === 'unlocked') return <>{children}</>

	// Bootstrap Success State (Show Recovery Key)
	if (bootstrapKey) {
		return (
			<div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
				<Card className="w-full max-w-lg shadow-2xl overflow-hidden relative group">
					<div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
					<div className="relative">
						<div className="h-2 bg-gradient-to-r from-amber-500/50 via-amber-500 to-amber-500/50" />
						<div className="p-6 space-y-6">
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-amber-500">
									<AlertTriangle className="w-5 h-5" />
									<h2 className="text-lg font-bold tracking-tight uppercase font-mono">Recovery Key Generated</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									This key is the <span className="text-foreground font-bold">only way</span> to restore access if you lose your password.
								</p>
							</div>

							<div className="bg-muted/50 border border-border p-4 rounded-lg font-mono text-xs break-all text-foreground select-all">
								{bootstrapKey}
							</div>

							<Button 
								className="w-full font-bold"
								variant="default"
								onClick={() => setBootstrapKey(null)}
							>
								I have saved this key
							</Button>
						</div>
					</div>
				</Card>
			</div>
		)
	}

	return (
		<div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
			<Card className="w-full max-w-md shadow-lg overflow-hidden relative border-border/50">
				<CardContent className="p-8">
					<div className="flex flex-col items-center justify-center space-y-6 mb-8">
						<div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
							{view === 'main' ? (
								<Lock className="w-8 h-8 text-primary" />
							) : (
								<KeyRound className="w-8 h-8 text-primary" />
							)}
						</div>
						
						<p className="text-xs font-bold text-foreground uppercase tracking-widest font-mono flex items-center justify-center gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
							{title}
						</p>
					</div>

					<AnimatePresence mode="wait" initial={false}>
						{view === 'main' ? (
							<motion.div
								key="main"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
								className="space-y-6"
							>
									{lastError && (
										<motion.div 
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded font-medium"
										>
											{lastError}
										</motion.div>
									)}

									<div className="space-y-2">
										<label className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono">
											Password Access
										</label>
										<Input
											type="password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="ENTER PASSWORD"
											className="font-mono"
											autoComplete="current-password"
											onKeyDown={(e) => {
												if (e.key === 'Enter' && password) {
													status === 'not_initialized' ? handleBootstrap() : handleUnlock()
												}
											}}
										/>
									</div>

									<div className="space-y-3">
										{status === 'not_initialized' ? (
											<Button 
												className="w-full font-bold tracking-wide"
												onClick={handleBootstrap} 
												disabled={isBusy || !password}
											>
												{isBusy ? 'Initializing...' : 'Initialize System'}
											</Button>
										) : (
											<Button 
												className="w-full font-bold tracking-wide"
												onClick={handleUnlock} 
												disabled={isBusy || !password}
											>
												{isBusy ? (
													<span className="flex items-center gap-2">
														<span className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
														Decrypting...
													</span>
												) : (
													<span className="flex items-center gap-2">
														Unlock <ArrowRight className="w-4 h-4" />
													</span>
												)}
											</Button>
										)}

										{status !== 'not_initialized' && (
											<div className="text-center">
												<button
													className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-widest font-mono hover:underline underline-offset-4 transition-colors"
													onClick={() => setView('recovery')}
												>
													Lost Password?
												</button>
											</div>
										)}
									</div>
								</motion.div>
							) : (
								<motion.div
									key="recovery"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{ duration: 0.2 }}
									className="space-y-6"
								>
									<div className="space-y-2">
										<label className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono">
											Recovery Key
										</label>
										<textarea
											value={recoveryKey}
											onChange={(e) => setRecoveryKey(e.target.value)}
											placeholder="PASTE RECOVERY KEY HERE"
											className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] font-mono resize-none"
											autoComplete="off"
										/>
									</div>

									<div className="space-y-2">
										<label className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono">
											New Password
										</label>
										<Input
											type="password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="SET NEW PASSWORD"
											className="font-mono"
											autoComplete="new-password"
										/>
									</div>

									<div className="space-y-3 pt-2">
										<Button 
											className="w-full font-bold tracking-wide"
											variant="destructive"
											onClick={handleRecover} 
											disabled={isBusy || !password || !recoveryKey}
										>
											{isBusy ? 'Recovering...' : 'Reset & Unlock'}
										</Button>

										<div className="text-center">
											<button
												className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-widest font-mono hover:underline underline-offset-4 transition-colors flex items-center justify-center gap-2 w-full"
												onClick={() => setView('main')}
											>
												<ArrowLeft className="w-3 h-3" />
												Return to Login
											</button>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
				</CardContent>
			</Card>
		</div>
	)
}


