import {aeadDecrypt, aeadEncrypt, b64Decode, b64Encode, b64UrlDecode, b64UrlEncode, deriveKekPw, randomBytes, type KdfParams, DEFAULT_KDF_PARAMS, type WrappedBlob} from './e2ee'
import {idbClear, idbDel, idbGet, idbSet} from './vault-storage'

type RemoteUserKeys = {
	cryptoVersion: number
	kdfSalt: string
	kdfParams: string
	wrappedUmkPw: string
	wrappedUmkPwIv: string
	wrappedUmkRk: string
	wrappedUmkRkIv: string
}

const STORAGE_DEVICE_KEY = 'device_key_b64'
const STORAGE_DEVICE_WRAPPED_UMK = 'device_wrapped_umk'

function parseKdfParams(raw: string): KdfParams {
	try {
		const obj = JSON.parse(raw) as Partial<KdfParams>
		if (obj.alg !== 'argon2id13' || typeof obj.opslimit !== 'number' || typeof obj.memlimit !== 'number') {
			throw new Error('Invalid KDF params')
		}
		return {alg: 'argon2id13', opslimit: obj.opslimit, memlimit: obj.memlimit}
	} catch {
		// Backstop for early deployments
		return DEFAULT_KDF_PARAMS
	}
}

function blobFromServer(ciphertextB64: string, nonceB64: string): WrappedBlob {
	return {ciphertextB64, nonceB64}
}

async function fetchUserKeys(): Promise<RemoteUserKeys | null> {
	const res = await fetch('/api/keys', {credentials: 'include'})
	if (res.status === 404) return null
	if (!res.ok) {
		let msg = `HTTP ${res.status}`
		try {
			const data = await res.json() as any
			msg = data?.error || data?.message || msg
		} catch {
			// ignore
		}
		throw new Error(`Failed to fetch user keys (${res.status}): ${msg}`)
	}
	return await res.json() as RemoteUserKeys
}

async function postBootstrap(payload: {
	cryptoVersion: number
	kdfSalt: string
	kdfParams: string
	wrappedUmkPw: string
	wrappedUmkPwIv: string
	wrappedUmkRk: string
	wrappedUmkRkIv: string
}): Promise<void> {
	const attempt = async () => {
		return await fetch('/api/keys/bootstrap', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify(payload)
		})
	}

	let res = await attempt()

	// Small retry for race where auth cookie isn’t visible to the next request yet.
	if (res.status === 401) {
		await new Promise(r => setTimeout(r, 250))
		res = await attempt()
	}

	if (res.status === 409) return
	if (!res.ok) {
		let msg = `HTTP ${res.status}`
		try {
			const data = await res.json() as any
			msg = data?.error || data?.message || msg
		} catch {
			// ignore
		}
		throw new Error(`Failed to bootstrap keys (${res.status}): ${msg}`)
	}
}

async function postRewrap(payload: {
	cryptoVersion?: number
	kdfSalt: string
	kdfParams: string
	wrappedUmkPw: string
	wrappedUmkPwIv: string
}): Promise<void> {
	const res = await fetch('/api/keys/rewrap', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		credentials: 'include',
		body: JSON.stringify(payload)
	})
	if (!res.ok) {
		let msg = `HTTP ${res.status}`
		try {
			const data = await res.json() as any
			msg = data?.error || data?.message || msg
		} catch {
			// ignore
		}
		throw new Error(`Failed to rewrap keys (${res.status}): ${msg}`)
	}
}

async function getOrCreateDeviceKey(): Promise<Uint8Array> {
	const existing = await idbGet(STORAGE_DEVICE_KEY)
	if (existing) return await b64Decode(existing)
	const deviceKey = await randomBytes(32)
	await idbSet(STORAGE_DEVICE_KEY, await b64Encode(deviceKey))
	return deviceKey
}

async function cacheUmkForDevice(umk: Uint8Array): Promise<void> {
	const deviceKey = await getOrCreateDeviceKey()
	const blob = await aeadEncrypt(umk, deviceKey)
	await idbSet(STORAGE_DEVICE_WRAPPED_UMK, JSON.stringify(blob))
}

async function tryLoadUmkFromDeviceCache(): Promise<Uint8Array | null> {
	try {
		const deviceKeyB64 = await idbGet(STORAGE_DEVICE_KEY)
		const wrapped = await idbGet(STORAGE_DEVICE_WRAPPED_UMK)
		if (!deviceKeyB64 || !wrapped) return null
		const deviceKey = await b64Decode(deviceKeyB64)
		const blob = JSON.parse(wrapped) as WrappedBlob
		return await aeadDecrypt(blob, deviceKey)
	} catch {
		return null
	}
}

export type VaultUnlockResult =
	| {status: 'unlocked'; umk: Uint8Array}
	| {status: 'not_initialized'}
	| {status: 'needs_recovery'}

/**
 * Bootstrap UMK + RK for a user after successful login.
 *
 * Returns a URL-safe Recovery Key string that must be shown once to the user.
 */
export async function vaultBootstrap(password: string): Promise<{umk: Uint8Array; recoveryKey: string}> {
	// UMK and RK are raw 32-byte secrets generated on-device.
	const umk = await randomBytes(32)
	const rkBytes = await randomBytes(32)
	const recoveryKey = await b64UrlEncode(rkBytes)

	// Password KEK KDF
	const saltBytes = await randomBytes(16)
	const kdfSalt = await b64Encode(saltBytes)
	const kdfParams: KdfParams = DEFAULT_KDF_PARAMS
	const kekPw = await deriveKekPw(password, kdfSalt, kdfParams)

	// Wrap UMK with password KEK and RK
	const wrappedPw = await aeadEncrypt(umk, kekPw)
	const wrappedRk = await aeadEncrypt(umk, rkBytes)

	await postBootstrap({
		cryptoVersion: 1,
		kdfSalt,
		kdfParams: JSON.stringify(kdfParams),
		wrappedUmkPw: wrappedPw.ciphertextB64,
		wrappedUmkPwIv: wrappedPw.nonceB64,
		wrappedUmkRk: wrappedRk.ciphertextB64,
		wrappedUmkRkIv: wrappedRk.nonceB64
	})

	// Remember this browser by caching UMK locally (encrypted under a device key)
	await cacheUmkForDevice(umk)

	return {umk, recoveryKey}
}

export async function vaultUnlock(): Promise<VaultUnlockResult> {
	const cached = await tryLoadUmkFromDeviceCache()
	if (cached) return {status: 'unlocked', umk: cached}

	// If keys are not initialized server-side, user is legacy/uninitialized.
	const keys = await fetchUserKeys()
	if (!keys) return {status: 'not_initialized'}

	// We have server-side wrapped keys, but no local unlock material.
	return {status: 'needs_recovery'}
}

export async function vaultUnlockWithPassword(password: string): Promise<VaultUnlockResult> {
	const cached = await tryLoadUmkFromDeviceCache()
	if (cached) return {status: 'unlocked', umk: cached}

	const keys = await fetchUserKeys()
	if (!keys) return {status: 'not_initialized'}

	const params = parseKdfParams(keys.kdfParams)
	const kekPw = await deriveKekPw(password, keys.kdfSalt, params)

	try {
		const umk = await aeadDecrypt(blobFromServer(keys.wrappedUmkPw, keys.wrappedUmkPwIv), kekPw)
		await cacheUmkForDevice(umk)
		return {status: 'unlocked', umk}
	} catch {
		// Likely password reset (password changed but wrapped_umk_pw not rewrapped) or wrong password.
		return {status: 'needs_recovery'}
	}
}

/**
 * Recover UMK using the Recovery Key (RK) and then rewrap UMK with the provided password,
 * updating server-side wrapped_umk_pw so future password unlock works.
 */
export async function vaultRecoverWithRecoveryKey(recoveryKey: string, password: string): Promise<VaultUnlockResult> {
	const keys = await fetchUserKeys()
	if (!keys) return {status: 'not_initialized'}

	const rkBytes = await b64UrlDecode(recoveryKey.trim())
	const umk = await aeadDecrypt(blobFromServer(keys.wrappedUmkRk, keys.wrappedUmkRkIv), rkBytes)

	// Re-wrap UMK for the (new) password
	const saltBytes = await randomBytes(16)
	const kdfSalt = await b64Encode(saltBytes)
	const kdfParams: KdfParams = DEFAULT_KDF_PARAMS
	const kekPw = await deriveKekPw(password, kdfSalt, kdfParams)
	const wrappedPw = await aeadEncrypt(umk, kekPw)

	await postRewrap({
		cryptoVersion: 1,
		kdfSalt,
		kdfParams: JSON.stringify(kdfParams),
		wrappedUmkPw: wrappedPw.ciphertextB64,
		wrappedUmkPwIv: wrappedPw.nonceB64
	})

	await cacheUmkForDevice(umk)
	return {status: 'unlocked', umk}
}

/**
 * Rewrap UMK with a new password-derived KEK (same password) using new KDF params.
 * Useful to migrate to mobile-friendly KDF settings.
 */
export async function vaultRewrapWithPassword(password: string, newParams: KdfParams): Promise<void> {
	const keys = await fetchUserKeys()
	if (!keys) throw new Error('Keys not initialized')

	// 1) Unwrap UMK using current server-stored params
	const oldParams = parseKdfParams(keys.kdfParams)
	const oldKek = await deriveKekPw(password, keys.kdfSalt, oldParams)
	const umk = await aeadDecrypt(blobFromServer(keys.wrappedUmkPw, keys.wrappedUmkPwIv), oldKek)

	// 2) Wrap UMK using new params + new salt
	const saltBytes = await randomBytes(16)
	const kdfSalt = await b64Encode(saltBytes)
	const newKek = await deriveKekPw(password, kdfSalt, newParams)
	const wrappedPw = await aeadEncrypt(umk, newKek)

	await postRewrap({
		cryptoVersion: 1,
		kdfSalt,
		kdfParams: JSON.stringify(newParams),
		wrappedUmkPw: wrappedPw.ciphertextB64,
		wrappedUmkPwIv: wrappedPw.nonceB64
	})
}

export async function vaultForgetThisBrowser(): Promise<void> {
	await idbDel(STORAGE_DEVICE_KEY)
	await idbDel(STORAGE_DEVICE_WRAPPED_UMK)
}

export async function vaultClearAllLocal(): Promise<void> {
	await idbClear()
}


