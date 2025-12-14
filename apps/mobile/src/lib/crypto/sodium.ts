type SodiumModule = typeof import('libsodium-wrappers-sumo')

let sodiumPromise: Promise<SodiumModule> | null = null

/**
 * Lazily load libsodium for React Native.
 *
 * In Expo/RN, libsodium-wrappers-sumo will typically use the asm.js fallback unless
 * WASM loading is supported/configured. We treat it as an implementation detail.
 */
export async function getSodium(): Promise<SodiumModule> {
	if (!sodiumPromise) {
		sodiumPromise = (async () => {
			const mod = await import('libsodium-wrappers-sumo')
			const sodium = (mod as any).default ? ((mod as any).default as SodiumModule) : mod
			await (sodium as any).ready
			return sodium as SodiumModule
		})()
	}
	return sodiumPromise
}


