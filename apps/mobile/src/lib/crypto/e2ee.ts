import {getSodium} from './sodium'

export type KdfParams = {
	alg: 'argon2id13'
	opslimit: number
	memlimit: number
}

export type WrappedBlob = {
	ciphertextB64: string
	nonceB64: string
}

export const DEFAULT_KDF_PARAMS: KdfParams = {
	alg: 'argon2id13',
	opslimit: 3,
	memlimit: 64 * 1024 * 1024
}

const CTX_FILE_WRAP = 'HCRNFILE'
const CTX_FILENAME = 'HCRNFNME'
const CTX_DEVICE = 'HCRNDEVC'

export async function randomBytes(length: number): Promise<Uint8Array> {
	const sodium = await getSodium()
	return sodium.randombytes_buf(length)
}

export async function b64Encode(bytes: Uint8Array): Promise<string> {
	const sodium = await getSodium()
	return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL)
}

export async function b64Decode(b64: string): Promise<Uint8Array> {
	const sodium = await getSodium()
	return sodium.from_base64(b64, sodium.base64_variants.ORIGINAL)
}

export async function b64UrlEncode(bytes: Uint8Array): Promise<string> {
	const sodium = await getSodium()
	return sodium.to_base64(bytes, sodium.base64_variants.URLSAFE_NO_PADDING)
}

export async function b64UrlDecode(b64url: string): Promise<Uint8Array> {
	const sodium = await getSodium()
	return sodium.from_base64(b64url, sodium.base64_variants.URLSAFE_NO_PADDING)
}

export async function deriveKekPw(password: string, saltB64: string, params: KdfParams = DEFAULT_KDF_PARAMS): Promise<Uint8Array> {
	const sodium = await getSodium()
	if (params.alg !== 'argon2id13') throw new Error(`Unsupported KDF alg: ${params.alg}`)

	const salt = sodium.from_base64(saltB64, sodium.base64_variants.ORIGINAL)
	const keyLen = 32
	return sodium.crypto_pwhash(
		keyLen,
		password,
		salt,
		params.opslimit,
		params.memlimit,
		sodium.crypto_pwhash_ALG_ARGON2ID13
	)
}

export async function deriveSubkey(masterKey32: Uint8Array, context8: string, subkeyId: number, length = 32): Promise<Uint8Array> {
	const sodium = await getSodium()
	if (context8.length !== 8) throw new Error('libsodium KDF context must be exactly 8 characters')
	return sodium.crypto_kdf_derive_from_key(length, subkeyId, context8, masterKey32)
}

export async function aeadEncrypt(plaintext: Uint8Array, key32: Uint8Array, aad?: Uint8Array): Promise<WrappedBlob> {
	const sodium = await getSodium()
	const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES)
	const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
		plaintext,
		aad ?? null,
		null,
		nonce,
		key32
	)
	return {
		ciphertextB64: sodium.to_base64(ciphertext, sodium.base64_variants.ORIGINAL),
		nonceB64: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL)
	}
}

export async function aeadDecrypt(blob: WrappedBlob, key32: Uint8Array, aad?: Uint8Array): Promise<Uint8Array> {
	const sodium = await getSodium()
	const ciphertext = sodium.from_base64(blob.ciphertextB64, sodium.base64_variants.ORIGINAL)
	const nonce = sodium.from_base64(blob.nonceB64, sodium.base64_variants.ORIGINAL)
	return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
		null,
		ciphertext,
		aad ?? null,
		nonce,
		key32
	)
}

export async function deriveUmkFileWrapKey(umk32: Uint8Array): Promise<Uint8Array> {
	return deriveSubkey(umk32, CTX_FILE_WRAP, 1, 32)
}

export async function deriveUmkFilenameKey(umk32: Uint8Array): Promise<Uint8Array> {
	return deriveSubkey(umk32, CTX_FILENAME, 1, 32)
}

export async function deriveDeviceKey(umk32: Uint8Array): Promise<Uint8Array> {
	return deriveSubkey(umk32, CTX_DEVICE, 1, 32)
}

export async function cryptoSelfTest(): Promise<void> {
	const sodium = await getSodium()
	const umk = sodium.randombytes_buf(32)
	const wrapKey = await deriveUmkFileWrapKey(umk)
	const msg = new TextEncoder().encode('halycron-e2ee-selftest')
	const blob = await aeadEncrypt(msg, wrapKey)
	const out = await aeadDecrypt(blob, wrapKey)
	if (sodium.memcmp(out, msg) !== true) {
		throw new Error('E2EE self-test failed: AEAD roundtrip mismatch')
	}
}


