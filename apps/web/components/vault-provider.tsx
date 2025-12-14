'use client'

import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {vaultBootstrap, vaultForgetThisBrowser, vaultRecoverWithRecoveryKey, vaultUnlock, vaultUnlockWithPassword, type VaultUnlockResult} from '@/lib/crypto/vault'
import {authClient} from '@/lib/auth/auth-client'
import {useDecryptionCache} from '@/stores/decryption-cache'

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

const VaultContext = createContext<VaultContextValue | null>(null)

export function VaultProvider({children}: {children: React.ReactNode}) {
	const {data: session} = authClient.useSession()
	const userKey = session?.user?.id || session?.user?.email || null
	const [status, setStatus] = useState<VaultStatus>('checking')
	const [umk, setUmk] = useState<Uint8Array | null>(null)
	const [lastError, setLastError] = useState<string | null>(null)
	const lastUserKeyRef = useRef<string | null>(null)

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
		// needs_recovery
		setUmk(null)
		setStatus('locked')
	}, [])

	const refresh = useCallback(async () => {
		// Only attempt to unlock when authenticated; otherwise we'd reuse a stale UMK across accounts.
		if (!userKey) {
			setUmk(null)
			setStatus('checking')
			setLastError(null)
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
	}, [applyResult, userKey])

	useEffect(() => {
		const run = async () => {
			const prevUserKey = lastUserKeyRef.current

			// On logout, clear in-memory UMK. Keep lastUserKeyRef so we can detect user switches on next login.
			if (!userKey) {
				setUmk(null)
				setStatus('checking')
				setLastError(null)
				return
			}

			// If the user changed (sign out + sign in, or switching accounts), clear cached UMK and decrypted URLs.
			if (prevUserKey && prevUserKey !== userKey) {
				await vaultForgetThisBrowser().catch(() => {})
				useDecryptionCache.getState().clearCache()
			}

			lastUserKeyRef.current = userKey
			await refresh()
		}

		run()
	}, [userKey, refresh])

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

export function useVault() {
	const ctx = useContext(VaultContext)
	if (!ctx) throw new Error('useVault must be used within VaultProvider')
	return ctx
}


