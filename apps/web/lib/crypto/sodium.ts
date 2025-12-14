// libsodium-wrappers-sumo ships without TS types in our setup; treat as untyped.
type Sodium = any

let sodiumPromise: Promise<Sodium> | null = null

/**
 * Lazily load libsodium (WASM/asm.js) and wait for it to be ready.
 *
 * NOTE: This must be called in any runtime that uses E2EE key derivation/wrapping.
 */
export async function getSodium(): Promise<Sodium> {
	if (!sodiumPromise) {
		sodiumPromise = (async () => {
			// libsodium-wrappers-sumo is CJS; in ESM builds it may appear under default.
			const mod: any = await import('libsodium-wrappers-sumo')
			const sodium: any = mod?.default ?? mod
			await sodium.ready
			return sodium
		})()
	}
	return sodiumPromise
}


