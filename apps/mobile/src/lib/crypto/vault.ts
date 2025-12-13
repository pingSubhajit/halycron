import * as SecureStore from 'expo-secure-store'
import {api} from '../api-client'
import {aeadDecrypt, aeadEncrypt, b64Decode, b64Encode, b64UrlDecode, b64UrlEncode, deriveKekPw, randomBytes, type KdfParams, DEFAULT_KDF_PARAMS, type WrappedBlob} from './e2ee'

type RemoteUserKeys = {
	cryptoVersion: number
	kdfSalt: string
	kdfParams: string
	wrappedUmkPw: string
	wrappedUmkPwIv: string
	wrappedUmkRk: string
	wrappedUmkRkIv: string
}

const STORAGE_DEVICE_KEY = 'vault_device_key_b64'
const STORAGE_DEVICE_WRAPPED_UMK = 'vault_device_wrapped_umk'

function parseKdfParams(raw: string): KdfParams {
	try {
		const obj = JSON.parse(raw) as Partial<KdfParams>
		if (obj.alg !== 'argon2id13' || typeof obj.opslimit !== 'number' || typeof obj.memlimit !== 'number') {
			throw new Error('Invalid KDF params')
		}
		return {alg: 'argon2id13', opslimit: obj.opslimit, memlimit: obj.memlimit}
	} catch {
		return DEFAULT_KDF_PARAMS
	}
}

function blobFromServer(ciphertextB64: string, nonceB64: string): WrappedBlob {
	return {ciphertextB64, nonceB64}
}

async function fetchUserKeys(): Promise<RemoteUserKeys | null> {
	try {
		return await api.get<RemoteUserKeys>('/api/keys')
	} catch (e) {
		// If server returns 404, api-client throws; treat as not initialized.
		if (e instanceof Error && e.message.toLowerCase().includes('not initialized')) return null
		if (e instanceof Error && e.message.toLowerCase().includes('404')) return null
		return null
	}
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
	await api.post('/api/keys/bootstrap', payload)
}

async function postRewrap(payload: {
	cryptoVersion?: number
	kdfSalt: string
	kdfParams: string
	wrappedUmkPw: string
	wrappedUmkPwIv: string
}): Promise<void> {
	await api.post('/api/keys/rewrap', payload)
}

async function getOrCreateDeviceKey(): Promise<Uint8Array> {
	const existing = await SecureStore.getItemAsync(STORAGE_DEVICE_KEY)
	if (existing) return await b64Decode(existing)
	const deviceKey = await randomBytes(32)
	await SecureStore.setItemAsync(STORAGE_DEVICE_KEY, await b64Encode(deviceKey))
	return deviceKey
}

async function cacheUmkForDevice(umk: Uint8Array): Promise<void> {
	const deviceKey = await getOrCreateDeviceKey()
	const blob = await aeadEncrypt(umk, deviceKey)
	await SecureStore.setItemAsync(STORAGE_DEVICE_WRAPPED_UMK, JSON.stringify(blob))
}

async function tryLoadUmkFromDeviceCache(): Promise<Uint8Array | null> {
	try {
		const deviceKeyB64 = await SecureStore.getItemAsync(STORAGE_DEVICE_KEY)
		const wrapped = await SecureStore.getItemAsync(STORAGE_DEVICE_WRAPPED_UMK)
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

export async function vaultBootstrap(password: string): Promise<{umk: Uint8Array; recoveryKey: string}> {
	const umk = await randomBytes(32)
	const rkBytes = await randomBytes(32)
	const recoveryKey = await b64UrlEncode(rkBytes)

	const saltBytes = await randomBytes(16)
	const kdfSalt = await b64Encode(saltBytes)
	const kdfParams: KdfParams = DEFAULT_KDF_PARAMS
	const kekPw = await deriveKekPw(password, kdfSalt, kdfParams)

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

	await cacheUmkForDevice(umk)
	return {umk, recoveryKey}
}

export async function vaultUnlock(): Promise<VaultUnlockResult> {
	const cached = await tryLoadUmkFromDeviceCache()
	if (cached) return {status: 'unlocked', umk: cached}
	const keys = await fetchUserKeys()
	if (!keys) return {status: 'not_initialized'}
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
		return {status: 'needs_recovery'}
	}
}

export async function vaultRecoverWithRecoveryKey(recoveryKey: string, password: string): Promise<VaultUnlockResult> {
	const keys = await fetchUserKeys()
	if (!keys) return {status: 'not_initialized'}

	const rkBytes = await b64UrlDecode(recoveryKey.trim())
	const umk = await aeadDecrypt(blobFromServer(keys.wrappedUmkRk, keys.wrappedUmkRkIv), rkBytes)

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

export async function vaultForgetThisDevice(): Promise<void> {
	await SecureStore.deleteItemAsync(STORAGE_DEVICE_KEY).catch(() => {})
	await SecureStore.deleteItemAsync(STORAGE_DEVICE_WRAPPED_UMK).catch(() => {})
}


