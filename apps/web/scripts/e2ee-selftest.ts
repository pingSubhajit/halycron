/**
 * Quick manual sanity check for libsodium-based E2EE primitives.
 *
 * Run (from repo root):
 *   node --import tsx apps/web/scripts/e2ee-selftest.ts
 *
 * (tsx is not currently a dependency in this repo; you can also compile via TS tooling.)
 */
import {cryptoSelfTest} from '../lib/crypto/e2ee'

async function main() {
	await cryptoSelfTest()
	// eslint-disable-next-line no-console
	console.log('E2EE self-test: OK')
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error('E2EE self-test: FAILED', err)
	process.exit(1)
})


