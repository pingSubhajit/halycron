import React, {useMemo, useState} from 'react'
import {View, Text, TextInput, Pressable, ActivityIndicator} from 'react-native'
import {useVault} from '@/src/components/vault-provider'
import {useSession} from '@/src/components/session-provider'
import {Button} from '@/src/components/ui/button'
import {Input} from '@/src/components/ui/input'
import {Lock} from '@/lib/icons/Lock'
import {KeyRound} from '@/lib/icons/KeyRound'
import {ArrowRight} from '@/lib/icons/ArrowRight'
import {ArrowLeft} from '@/lib/icons/ArrowLeft'
import {AlertTriangle} from '@/lib/icons/AlertTriangle'
import {Copy} from '@/lib/icons/Copy'
import {Check} from '@/lib/icons/Check'
import * as Clipboard from 'expo-clipboard'

export const VaultGate = ({children}: {children: React.ReactNode}) => {
	const {status: authStatus} = useSession()
	const {status, lastError, unlockWithPassword, recoverWithRecoveryKey, bootstrap} = useVault()
	const [password, setPassword] = useState('')
	const [recoveryKey, setRecoveryKey] = useState('')
	const [busy, setBusy] = useState(false)
	const [view, setView] = useState<'main' | 'recovery'>('main')
	const [bootstrapKey, setBootstrapKey] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	const title = useMemo(() => {
		if (status === 'checking') return 'Initializing System...'
		if (status === 'not_initialized') return 'Encryption Setup'
		return 'Vault Locked'
	}, [status])

	// If the user isn't authenticated, don't block routing; the app will redirect to onboarding/login.
	if (authStatus !== 'authenticated') return <>{children}</>

	if (status === 'unlocked') return <>{children}</>

	const handleUnlock = async () => {
		try {
			setBusy(true)
			const result = await unlockWithPassword(password)
			if (result.status === 'needs_recovery') {
				setView('recovery')
			}
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

	const handleCopyKey = async () => {
		if (bootstrapKey) {
			await Clipboard.setStringAsync(bootstrapKey)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	// Loading State
	if (status === 'checking') {
		return (
			<View className="flex-1 bg-background items-center justify-center p-6">
				<View className="w-full max-w-sm items-center gap-4">
					<View className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 items-center justify-center">
						<Lock className="w-8 h-8 text-primary" />
					</View>
					<View className="w-full gap-2 items-center">
						<View className="h-1 w-full bg-muted rounded-full overflow-hidden">
							<View className="h-full bg-primary w-2/3" />
						</View>
						<Text className="text-xs text-muted-foreground tracking-widest uppercase font-mono">
							Decrypting local storage...
						</Text>
					</View>
				</View>
			</View>
		)
	}

	// Bootstrap Success State (Show Recovery Key)
	if (bootstrapKey) {
		return (
			<View className="flex-1 bg-background items-center justify-center p-4">
				<View className="w-full max-w-md bg-card rounded-2xl overflow-hidden shadow-sm">
					{/* Warning header bar */}
					<View className="h-2 bg-amber-500" />
					
					<View className="p-6 gap-6">
						{/* Header */}
						<View className="gap-2">
							<View className="flex-row items-center gap-2">
								<AlertTriangle className="w-6 h-6 text-amber-500" />
								<Text className="text-lg font-bold text-foreground uppercase tracking-tight font-mono">
									Recovery Key Generated
								</Text>
							</View>
							<Text className="text-base text-muted-foreground">
								This key is the <Text className="text-foreground font-bold">only way</Text> to restore access if you lose your password.
							</Text>
						</View>

						{/* Recovery Key Display */}
						<View className="relative">
							<View className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-5 pr-12">
								<Text className="font-mono text-base text-foreground" selectable>
									{bootstrapKey}
								</Text>
							</View>
							<Pressable
								onPress={handleCopyKey}
								className="absolute right-3 top-1/2 -translate-y-1/2 p-2"
							>
								{copied ? (
									<Check className="w-5 h-5 text-green-500" />
								) : (
									<Copy className="w-5 h-5 text-muted-foreground" />
								)}
							</Pressable>
						</View>

						{/* Action Button */}
						<Button 
							className="w-full h-14 rounded-xl"
							onPress={() => setBootstrapKey(null)}
						>
							<Text className="text-primary font-bold text-lg">I have saved this key</Text>
						</Button>
					</View>
				</View>
			</View>
		)
	}

	return (
		<View className="flex-1 bg-background items-center justify-center p-4">
			<View className="w-full max-w-md bg-card rounded-2xl overflow-hidden">
				<View className="p-8">
					{/* Header with Icon */}
					<View className="items-center justify-center mb-8">
						<View className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-zinc-800 items-center justify-center mb-6">
							{view === 'main' ? (
								<Lock className="w-10 h-10 text-primary" />
							) : (
								<KeyRound className="w-10 h-10 text-primary" />
							)}
						</View>

						<View className="flex-row items-center justify-center gap-2">
							<View className="w-1.5 h-1.5 rounded-full bg-primary" />
							<Text className="text-sm font-bold text-primary-foreground opacity-60 uppercase tracking-widest font-mono">
								{title}
							</Text>
						</View>
					</View>

					{view === 'main' ? (
						<View>
							{/* Error Message */}
							{lastError && (
								<View className="p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-xl">
									<Text className="text-sm text-destructive font-medium">
										{lastError}
									</Text>
								</View>
							)}

							{/* Password Input */}
							<View className="mb-6">
								<Text className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono mb-2">
									Password Access
								</Text>
								<Input
									secureTextEntry
									value={password}
									onChangeText={setPassword}
									placeholder="ENTER PASSWORD"
									className="w-full border border-input bg-background px-4 py-3 text-base text-foreground rounded-xl min-h-[120px] font-mono"
									autoCapitalize="none"
									autoCorrect={false}
									onSubmitEditing={() => {
										if (password) {
											status === 'not_initialized' ? handleBootstrap() : handleUnlock()
										}
									}}
								/>
							</View>

							{/* Action Buttons */}
							<View className="gap-4">
								{status === 'not_initialized' ? (
									<Button
										className="w-full h-14 rounded-xl"
										disabled={busy || !password}
										onPress={handleBootstrap}
									>
										{busy ? (
											<View className="flex-row items-center gap-2">
												<ActivityIndicator size="small" color="currentColor" />
												<Text className="text-primary font-bold tracking-wide text-lg">Initializing...</Text>
											</View>
										) : (
											<Text className="text-primary font-bold tracking-wide text-lg">Initialize System</Text>
										)}
									</Button>
								) : (
									<Button
										className="w-full h-14 rounded-xl"
										disabled={busy || !password}
										onPress={handleUnlock}
									>
										{busy ? (
											<View className="flex-row items-center gap-2">
												<ActivityIndicator size="small" color="currentColor" />
												<Text className="text-primary font-bold tracking-wide text-lg">Decrypting...</Text>
											</View>
										) : (
											<View className="flex-row items-center gap-2">
												<Text className="text-primary font-bold tracking-wide text-lg">Unlock</Text>
												<ArrowRight className="w-5 h-5 text-primary" />
											</View>
										)}
									</Button>
								)}

								{status !== 'not_initialized' && (
									<Pressable
										className="py-3"
										onPress={() => setView('recovery')}
									>
										<Text className="text-primary-foreground opacity-60 text-xs uppercase tracking-widest font-mono text-center">
											Lost Password?
										</Text>
									</Pressable>
								)}
							</View>
						</View>
					) : (
						<View>
							{/* Recovery Key Input */}
							<View className="mb-6">
								<Text className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono mb-2">
									Recovery Key
								</Text>
								<TextInput
									value={recoveryKey}
									onChangeText={setRecoveryKey}
									placeholder="PASTE RECOVERY KEY HERE"
									placeholderTextColor="#71717a"
									className="w-full border border-input bg-background px-4 py-3 text-base text-foreground rounded-xl min-h-[120px] font-mono"
									multiline
									textAlignVertical="top"
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>

							{/* New Password Input */}
							<View className="mb-8">
								<Text className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono mb-2">
									New Password
								</Text>
								<Input
									secureTextEntry
									value={password}
									onChangeText={setPassword}
									placeholder="SET NEW PASSWORD"
									className="w-full border border-input bg-background px-4 py-3 text-base text-foreground rounded-xl min-h-[120px] font-mono"
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>

							{/* Action Buttons */}
							<View className="gap-4">
								<Button
									className="w-full h-14 rounded-xl"
									variant="destructive"
									disabled={busy || !password || !recoveryKey}
									onPress={handleRecover}
								>
									{busy ? (
										<View className="flex-row items-center gap-2">
											<ActivityIndicator size="small" color="white" />
											<Text className="text-destructive-foreground font-bold tracking-wide text-lg">Recovering...</Text>
										</View>
									) : (
										<Text className="text-destructive-foreground font-bold tracking-wide text-lg">Reset & Unlock</Text>
									)}
								</Button>

								<Pressable
									className="py-3 flex-row items-center justify-center gap-2"
									onPress={() => setView('main')}
								>
									<ArrowLeft className="w-3 h-3 text-primary-foreground opacity-60" />
									<Text className="text-primary-foreground opacity-60 text-xs uppercase tracking-widest font-mono">
										Return to Login
									</Text>
								</Pressable>
							</View>
						</View>
					)}
				</View>
			</View>
		</View>
	)
}
