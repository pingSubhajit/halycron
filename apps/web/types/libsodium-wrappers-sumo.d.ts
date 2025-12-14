declare module 'libsodium-wrappers-sumo' {
	// libsodium-wrappers-sumo does not ship TS types in our setup.
	// We treat it as an untyped module and rely on runtime self-tests.
	const sodium: any
	export default sodium
}


