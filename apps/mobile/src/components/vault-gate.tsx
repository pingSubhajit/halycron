import React, {useMemo, useState} from 'react'
import {View, Text} from 'react-native'
import {useVault} from '@/src/components/vault-provider'
import {useSession} from '@/src/components/session-provider'
import {Button} from '@/src/components/ui/button'
import {Input} from '@/src/components/ui/input'

export const VaultGate = ({children}: {children: React.ReactNode}) => {
	const {status: authStatus} = useSession()
	const {status, lastError, unlockWithPassword, recoverWithRecoveryKey, bootstrap} = useVault()
	const [password, setPassword] = useState('')
	const [recoveryKey, setRecoveryKey] = useState('')
	const [busy, setBusy] = useState(false)
	const [showRecovery, setShowRecovery] = useState(false)
	const [bootstrapKey, setBootstrapKey] = useState<string | null>(null)

	const title = useMemo(() => {
		if (status === 'checking') return 'Unlocking vault...'
		if (status === 'not_initialized') return 'Set up encryption'
		return 'Vault locked'
	}, [status])

	// If the user isn't authenticated, don't block routing; the app will redirect to onboarding/login.
	if (authStatus !== 'authenticated') return <>{children}</>

	if (status === 'unlocked') return <>{children}</>

	const handleUnlock = async () => {
		try {
			setBusy(true)
			const result = await unlockWithPassword(password)
			if (result.status === 'needs_recovery') setShowRecovery(true)
		} finally {
			setBusy(false)
		}
	}

	const handleRecover = async () => {
		try {
			setBusy(true)
			await recoverWithRecoveryKey(recoveryKey, password)
		} finally {
			setBusy(false)
		}
	}

	const handleBootstrap = async () => {
		try {
			setBusy(true)
			const {recoveryKey: rk} = await bootstrap(password)
			setBootstrapKey(rk)
		} finally {
			setBusy(false)
		}
	}

	return (
		<View className="flex-1 bg-background items-center justify-center p-6">
			<View className="w-full max-w-md bg-card rounded-2xl p-5 border border-border">
				<Text className="text-xl font-bold text-primary-foreground">{title}</Text>
				<Text className="text-primary-foreground/70 mt-2">
					{status === 'not_initialized'
						? 'We’ll generate a master key on this device and give you a Recovery Key. Save it to restore access after password reset.'
						: 'Enter your password to unlock encrypted photos on this device.'}
				</Text>

				{lastError ? (
					<Text className="text-red-500 mt-3">{lastError}</Text>
				) : null}

				{bootstrapKey ? (
					<View className="mt-4">
						<Text className="text-sm text-primary-foreground mb-2">Your Recovery Key (save this now)</Text>
						<View className="border border-border rounded-lg p-3">
							<Text className="text-primary-foreground font-mono text-sm">{bootstrapKey}</Text>
						</View>
						<Text className="text-xs text-primary-foreground/60 mt-2">
							We cannot recover this for you.
						</Text>
						<Button className="mt-4" onPress={() => setBootstrapKey(null)}>
							<Text className="text-primary-foreground font-semibold">I saved it</Text>
						</Button>
					</View>
				) : (
					<View className="mt-4 gap-3">
						<Input
							placeholder="Password"
							secureTextEntry
							value={password}
							onChangeText={setPassword}
							className="h-12"
						/>

						{status === 'not_initialized' ? (
							<Button disabled={busy || !password} onPress={handleBootstrap}>
								<Text className="text-primary-foreground font-semibold">{busy ? 'Setting up...' : 'Set up encryption'}</Text>
							</Button>
						) : (
							<Button disabled={busy || !password} onPress={handleUnlock}>
								<Text className="text-primary-foreground font-semibold">{busy ? 'Unlocking...' : 'Unlock vault'}</Text>
							</Button>
						)}

						{status !== 'not_initialized' ? (
							<>
								<Button variant="outline" onPress={() => setShowRecovery(v => !v)}>
									<Text className="text-primary-foreground">Use Recovery Key</Text>
								</Button>
								{showRecovery ? (
									<View className="gap-3">
										<Input
											placeholder="Recovery Key"
											value={recoveryKey}
											onChangeText={setRecoveryKey}
											autoCapitalize="none"
											autoCorrect={false}
										/>
										<Button disabled={busy || !password || !recoveryKey} onPress={handleRecover}>
											<Text className="text-primary-foreground font-semibold">{busy ? 'Recovering...' : 'Recover and unlock'}</Text>
										</Button>
									</View>
								) : null}
							</>
						) : null}
					</View>
				)}
			</View>
		</View>
	)
}


