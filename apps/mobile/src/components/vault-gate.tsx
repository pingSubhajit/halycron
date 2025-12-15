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
					<View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
						<Lock className="w-6 h-6 text-primary" />
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
				<View className="w-full max-w-md bg-card rounded-2xl overflow-hidden border border-border">
					{/* Warning header bar */}
					<View className="h-2 bg-amber-500" />
					
					<View className="p-6 gap-6">
						{/* Header */}
						<View className="gap-2">
							<View className="flex-row items-center gap-2">
								<AlertTriangle className="w-5 h-5 text-amber-500" />
								<Text className="text-lg font-bold text-foreground uppercase tracking-tight font-mono">
									Recovery Key Generated
								</Text>
							</View>
							<Text className="text-sm text-muted-foreground">
								This key is the <Text className="text-foreground font-bold">only way</Text> to restore access if you lose your password.
							</Text>
						</View>

						{/* Recovery Key Display */}
						<View className="relative">
							<View className="bg-muted/50 border border-border p-4 pr-12 rounded-lg">
								<Text className="font-mono text-sm text-foreground" selectable>
									{bootstrapKey}
								</Text>
							</View>
							<Pressable
								onPress={handleCopyKey}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
							>
								{copied ? (
									<Check className="w-4 h-4 text-green-500" />
								) : (
									<Copy className="w-4 h-4 text-muted-foreground" />
								)}
							</Pressable>
						</View>

						{/* Action Button */}
						<Button 
							className="w-full rounded-lg"
							onPress={() => setBootstrapKey(null)}
						>
							<Text className="text-primary font-bold">I have saved this key</Text>
						</Button>
					</View>
				</View>
			</View>
		)
	}

	return (
		<View className="flex-1 bg-background items-center justify-center p-4">
			<View className="w-full max-w-md bg-card rounded-2xl border border-border/50 overflow-hidden">
				<View className="p-8">
					{/* Header with Icon */}
					<View className="items-center justify-center gap-6 mb-8">
						<View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center">
							{view === 'main' ? (
								<Lock className="w-8 h-8 text-primary" />
							) : (
								<KeyRound className="w-8 h-8 text-primary" />
							)}
						</View>

						<View className="flex-row items-center justify-center gap-2">
							<View className="w-1.5 h-1.5 rounded-full bg-primary" />
							<Text className="text-xs font-bold text-foreground uppercase tracking-widest font-mono">
								{title}
							</Text>
						</View>
					</View>

					{view === 'main' ? (
						<View className="gap-6">
							{/* Error Message */}
							{lastError && (
								<View className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
									<Text className="text-xs text-destructive font-medium">
										{lastError}
									</Text>
								</View>
							)}

							{/* Password Input */}
							<View className="gap-2">
								<Text className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono">
									Password Access
								</Text>
								<Input
									secureTextEntry
									value={password}
									onChangeText={setPassword}
									placeholder="ENTER PASSWORD"
									className="h-12 font-mono rounded-lg"
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
							<View className="gap-3">
								{status === 'not_initialized' ? (
									<Button
										className="w-full rounded-lg"
										disabled={busy || !password}
										onPress={handleBootstrap}
									>
										{busy ? (
											<View className="flex-row items-center gap-2">
												<ActivityIndicator size="small" color="currentColor" />
												<Text className="text-primary font-bold tracking-wide">Initializing...</Text>
											</View>
										) : (
											<Text className="text-primary font-bold tracking-wide">Initialize System</Text>
										)}
									</Button>
								) : (
									<Button
										className="w-full rounded-lg"
										disabled={busy || !password}
										onPress={handleUnlock}
									>
										{busy ? (
											<View className="flex-row items-center gap-2">
												<ActivityIndicator size="small" color="currentColor" />
												<Text className="text-primary font-bold tracking-wide">Decrypting...</Text>
											</View>
										) : (
											<View className="flex-row items-center gap-2">
												<Text className="text-primary font-bold tracking-wide">Unlock</Text>
												<ArrowRight className="w-4 h-4 text-primary" />
											</View>
										)}
									</Button>
								)}

								{status !== 'not_initialized' && (
									<Pressable
										className="py-2"
										onPress={() => setView('recovery')}
									>
										<Text className="text-muted-foreground text-xs uppercase tracking-widest font-mono text-center">
											Lost Password?
										</Text>
									</Pressable>
								)}
							</View>
						</View>
					) : (
						<View className="gap-6">
							{/* Recovery Key Input */}
							<View className="gap-2">
								<Text className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono">
									Recovery Key
								</Text>
								<TextInput
									value={recoveryKey}
									onChangeText={setRecoveryKey}
									placeholder="PASTE RECOVERY KEY HERE"
									placeholderTextColor="#71717a"
									className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground rounded-lg min-h-[100px] font-mono"
									multiline
									textAlignVertical="top"
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>

							{/* New Password Input */}
							<View className="gap-2">
								<Text className="text-xs uppercase text-muted-foreground font-bold tracking-wider font-mono">
									New Password
								</Text>
								<Input
									secureTextEntry
									value={password}
									onChangeText={setPassword}
									placeholder="SET NEW PASSWORD"
									className="h-12 font-mono rounded-lg"
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>

							{/* Action Buttons */}
							<View className="gap-3 pt-2">
								<Button
									className="w-full rounded-lg"
									variant="destructive"
									disabled={busy || !password || !recoveryKey}
									onPress={handleRecover}
								>
									{busy ? (
										<View className="flex-row items-center gap-2">
											<ActivityIndicator size="small" color="white" />
											<Text className="text-destructive-foreground font-bold tracking-wide">Recovering...</Text>
										</View>
									) : (
										<Text className="text-destructive-foreground font-bold tracking-wide">Reset & Unlock</Text>
									)}
								</Button>

								<Pressable
									className="py-2 flex-row items-center justify-center gap-2"
									onPress={() => setView('main')}
								>
									<ArrowLeft className="w-3 h-3 text-muted-foreground" />
									<Text className="text-muted-foreground text-xs uppercase tracking-widest font-mono">
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
