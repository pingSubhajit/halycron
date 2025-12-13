type SodiumModule = typeof import('libsodium-wrappers-sumo')

let sodiumPromise: Promise<SodiumModule> | null = null

/**
 * Lazily load libsodium (WASM/asm.js) and wait for it to be ready.
 *
 * NOTE: This must be called in any runtime that uses E2EE key derivation/wrapping.
 */
export async function getSodium(): Promise<SodiumModule> {
	if (!sodiumPromise) {
		sodiumPromise = (async () => {
			// libsodium-wrappers-sumo is CJS; in ESM builds it may appear under default.
			const mod = await import('libsodium-wrappers-sumo')
			const sodium = (mod as any).default ? ((mod as any).default as SodiumModule) : mod
			await (sodium as any).ready
			return sodium as SodiumModule
		})()
	}
	return sodiumPromise
}


