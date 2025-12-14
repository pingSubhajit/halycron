import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useSession} from '@/src/components/session-provider'
import {vaultBootstrap, vaultRecoverWithRecoveryKey, vaultUnlock, vaultUnlockWithPassword, type VaultUnlockResult} from '@/src/lib/crypto/vault'

type VaultStatus = 'checking' | 'unlocked' | 'locked' | 'not_initialized'

type VaultContextValue = {
	status: VaultStatus
	umk: Uint8Array | null
	lastError: string | null
	refresh: () => Promise<void>
	unlockWithPassword: (password: string) => Promise<VaultUnlockResult>
	recoverWithRecoveryKey: (recoveryKey: string, password: string) => Promise<VaultUnlockResult>
	bootstrap: (password: string) => Promise<{recoveryKey: string}>
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined)

export const VaultProvider = ({children}: {children: React.ReactNode}) => {
	const {status: authStatus, user} = useSession()
	const [status, setStatus] = useState<VaultStatus>('checking')
	const [umk, setUmk] = useState<Uint8Array | null>(null)
	const [lastError, setLastError] = useState<string | null>(null)

	const applyResult = useCallback((result: VaultUnlockResult) => {
		if (result.status === 'unlocked') {
			setUmk(result.umk)
			setStatus('unlocked')
			setLastError(null)
			return
		}
		if (result.status === 'not_initialized') {
			setUmk(null)
			setStatus('not_initialized')
			return
		}
		setUmk(null)
		setStatus('locked')
	}, [])

	const refresh = useCallback(async () => {
		if (authStatus !== 'authenticated' || !user) {
			setUmk(null)
			setStatus('checking')
			return
		}
		try {
			setStatus('checking')
			const result = await vaultUnlock()
			applyResult(result)
		} catch (e) {
			setLastError(e instanceof Error ? e.message : 'Failed to load vault')
			setStatus('locked')
		}
	}, [authStatus, user, applyResult])

	useEffect(() => {
		refresh()
	}, [refresh])

	const unlockWithPassword = useCallback(async (password: string) => {
		try {
			const result = await vaultUnlockWithPassword(password)
			applyResult(result)
			return result
		} catch (e) {
			setLastError(e instanceof Error ? e.message : 'Failed to unlock vault')
			setStatus('locked')
			return {status: 'needs_recovery'} as const
		}
	}, [applyResult])

	const recoverWithRecoveryKey = useCallback(async (recoveryKey: string, password: string) => {
		try {
			const result = await vaultRecoverWithRecoveryKey(recoveryKey, password)
			applyResult(result)
			return result
		} catch (e) {
			setLastError(e instanceof Error ? e.message : 'Failed to recover vault')
			setStatus('locked')
			return {status: 'needs_recovery'} as const
		}
	}, [applyResult])

	const bootstrap = useCallback(async (password: string) => {
		const {umk: newUmk, recoveryKey} = await vaultBootstrap(password)
		setUmk(newUmk)
		setStatus('unlocked')
		setLastError(null)
		return {recoveryKey}
	}, [])

	const value = useMemo<VaultContextValue>(() => ({
		status,
		umk,
		lastError,
		refresh,
		unlockWithPassword,
		recoverWithRecoveryKey,
		bootstrap
	}), [status, umk, lastError, refresh, unlockWithPassword, recoverWithRecoveryKey, bootstrap])

	return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export const useVault = (): VaultContextValue => {
	const ctx = useContext(VaultContext)
	if (!ctx) throw new Error('useVault must be used within VaultProvider')
	return ctx
}


