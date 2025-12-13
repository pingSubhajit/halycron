/**
 * Minimal IndexedDB KV storage for the web vault.
 *
 * We intentionally avoid adding dependencies (idb-keyval) to keep the surface small.
 * This storage is best-effort; in restricted browsers it may fail and we fall back to
 * requiring password unlock each session.
 */

const DB_NAME = 'halycron_vault'
const DB_VERSION = 1
const STORE = 'kv'

async function openDb(): Promise<IDBDatabase> {
	return await new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION)
		req.onupgradeneeded = () => {
			const db = req.result
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE)
			}
		}
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

export async function idbGet(key: string): Promise<string | null> {
	const db = await openDb()
	return await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readonly')
		const store = tx.objectStore(STORE)
		const req = store.get(key)
		req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
		req.onerror = () => reject(req.error)
	})
}

export async function idbSet(key: string, value: string): Promise<void> {
	const db = await openDb()
	return await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite')
		const store = tx.objectStore(STORE)
		const req = store.put(value, key)
		req.onsuccess = () => resolve()
		req.onerror = () => reject(req.error)
	})
}

export async function idbDel(key: string): Promise<void> {
	const db = await openDb()
	return await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite')
		const store = tx.objectStore(STORE)
		const req = store.delete(key)
		req.onsuccess = () => resolve()
		req.onerror = () => reject(req.error)
	})
}

export async function idbClear(): Promise<void> {
	const db = await openDb()
	return await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite')
		const store = tx.objectStore(STORE)
		const req = store.clear()
		req.onsuccess = () => resolve()
		req.onerror = () => reject(req.error)
	})
}


