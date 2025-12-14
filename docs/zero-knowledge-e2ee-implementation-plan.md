### Zero‑knowledge / E2EE implementation plan (photos + filenames)

This document is the implementation tracker for upgrading Halycron to a **real zero‑knowledge design** where an attacker with **DB + S3 access cannot decrypt photo bytes or filenames**.

---

### Scope (what we are promising)
- **Zero‑knowledge definition (marketing)**: If an attacker compromises **Postgres DB + S3 objects**, they still cannot recover:
  - **Photo bytes**
  - **User-visible filenames**
- **Out of scope / not promised (for this rollout)**:
  - Strong “malicious server cannot trick clients” guarantees (e.g., PAKE/OPAQUE/transparent key verification).
  - Protecting against a compromised client device / malware / XSS on web.

---

### Decisions locked in
- **Password reset preserves access**: ✅ yes, via recovery.
- **Recovery at signup**: ✅ show a **Recovery Key** at signup; user must save it.
- **Sharing links keep working (same recipient UX)**: ✅ yes.
- **Non‑PIN share links**: ✅ use URL fragment `#k=...` to carry the Share Key (not sent to server).
- **PIN shares**: ✅ continue the same UX (recipient enters PIN, then can view/download).
- **QR login remains**: ✅ keep QR login for session creation; vault unlock is separate.

---

### Current state (why we’re not zero‑knowledge yet)
- Today, `encryptedFileKey` is a misnomer: it is the **raw per-photo encryption key** stored in DB.
- Filenames leak:
  - DB stores `originalFilename` plaintext.
  - S3 object keys embed a sanitized filename suffix.

---

### Design overview (key hierarchy)
- **UMK (User Master Key)**: random 32 bytes, generated client-side once per account.
- **KEK_pw**: derived client-side from password using **Argon2id** (`salt + params` stored).
- **RK (Recovery Key)**: random key shown once at signup; used for password reset recovery.
- **UMK is stored server-side only as wrapped blobs**:
  - `wrapped_umk_pw = Enc(KEK_pw, UMK)`
  - `wrapped_umk_rk = Enc(RK, UMK)`
- **Per-photo DEK**: random 32 bytes, encrypts photo bytes (AES‑256‑GCM).
- **Wrapped DEK**: `wrapped_dek = Enc(UMK_file_wrap_key, DEK)` (or direct Enc(UMK, DEK) with subkeying).
- **Encrypted filename**: `encrypted_filename = Enc(UMK_filename_key, filename)`

---

### Sharing model (to keep links working)
- Introduce a per‑share **Share Key (SK)** generated client-side by the sharer.
- For each shared photo:
  - unwrap DEK with UMK locally
  - wrap DEK with SK and store it with the share record
  - encrypt filename with SK and store it with the share record
- **Non‑PIN shares**: SK is embedded in the URL fragment (`/shared/{token}#k=...`), so the server never receives it.
- **PIN shares**: store **SK encrypted under a PIN‑derived key** (slow KDF).

---

### Session vs Vault (QR login compatibility)
- **Session**: proves identity; created via password login or QR login.
- **Vault unlocked**: UMK is available on device; required to decrypt photos and filenames.
- After QR login, the user may be **logged in but vault‑locked** until they unlock via:
  - local cached UMK (mobile SecureStore / web in-memory session cache)
  - password entry
  - recovery key entry (especially after password reset)
  - (optional future) device link / key transfer from an already‑unlocked device

---

## Phased rollout checklist

### Phase 1 — DB schema + migrations (server-only primitives)
- [ ] **Create `user_keys` table**
  - **Fields**: `user_id`, `crypto_version`, `kdf_salt`, `kdf_params`, `wrapped_umk_pw`, `wrapped_umk_pw_iv`, `wrapped_umk_rk`, `wrapped_umk_rk_iv`, timestamps.
  - **Repo touchpoints**: `apps/web/db/schema.ts` + new drizzle migration.
- [ ] **Extend `photos` with v1 crypto fields** (keep legacy temporarily)
  - Add: `encryption_version`, `content_iv`, `wrapped_dek`, `wrapped_dek_iv`, `encrypted_filename`, `filename_iv`, optional alg fields.
  - Keep legacy for compatibility: `encrypted_file_key`, `file_key_iv`, `original_filename`, existing `s3_key`.
  - **Repo touchpoints**: `apps/web/db/schema.ts` + migration.
- [ ] **Add share-key storage**
  - Add `shared_link_keys` (or equivalent columns) for PIN-wrapped SK:
    - `share_link_id`, `sk_wrapped_by_pin`, `pin_kdf_salt`, `pin_kdf_params`, `sk_wrap_iv`, optional alg.
  - Extend `shared_photos` to store per-photo wrapped DEK + encrypted filename for share recipients:
    - `wrapped_dek_for_share`, `wrapped_dek_for_share_iv`, `encrypted_filename_for_share`, `filename_for_share_iv`.
  - **Repo touchpoints**: `apps/web/db/schema.ts` + migration.

**Acceptance criteria**
- DB supports v0 legacy + v1 E2EE concurrently.
- Existing clients continue to function without changes.

---

### Phase 2 — Vault bootstrap + recovery key (web + mobile)
- [ ] **Client Vault/KeyManager module**
  - Generate UMK + RK at signup.
  - Derive KEK_pw from password via Argon2id.
  - Wrap UMK with KEK_pw and RK.
  - Cache UMK locally:
    - **Mobile**: `expo-secure-store` (optionally biometrics).
    - **Web**: in-memory session cache (optional IndexedDB only if we accept XSS risks).
- [ ] **Server endpoints**
  - `POST /api/keys/bootstrap`: store `user_keys` wrapped blobs + KDF params.
  - `GET /api/keys`: fetch wrapped UMK blobs + KDF params.
  - `POST /api/keys/rewrap`: update wrapped UMK after password reset / change.

**Acceptance criteria**
- New accounts have a `user_keys` row.
- Server never receives plaintext UMK or RK.
- Recovery key is presented once and must be acknowledged/saved.

---

### Phase 3 — Photos v1 (bytes + filenames) + stop S3 filename leaks
- [ ] **S3 object keys become random (no filename)**
  - Update key generation to remove sanitized filename suffix.
  - **Repo touchpoints**: `apps/web/lib/s3-client.ts`.
- [ ] **Upload flow**
  - Generate DEK; encrypt bytes (AES‑GCM).
  - Wrap DEK under UMK-derived wrap key; store wrapped DEK fields.
  - Encrypt filename under UMK-derived filename key; store encrypted filename fields.
  - **Repo touchpoints**:
    - Web: `apps/web/app/api/photos/utils.ts`, `apps/web/app/api/photos/mutation.ts`, `apps/web/app/api/photos/route.ts`
    - Mobile: `apps/mobile/src/lib/upload-utils.ts`, `apps/mobile/src/hooks/use-photo-upload.ts`
- [ ] **Download/display flow**
  - Unwrap DEK locally; decrypt bytes locally.
  - Decrypt filename locally for UI/download.
  - **Repo touchpoints**:
    - Web: `apps/web/hooks/use-decrypted-url.ts`, `apps/web/components/encrypted-image.tsx`
    - Mobile: `apps/mobile/src/lib/crypto-utils.ts`, `apps/mobile/src/lib/download-utils.ts`

**Acceptance criteria**
- New photos have no plaintext filename in DB and no plaintext DEK in DB.
- S3 keys do not reveal filenames.
- UI still shows filenames client-side.

---

### Phase 4 — Sharing v1 (same UX, zero‑knowledge for recipients)
- [ ] **Share creation (owner device)**
  - Generate SK.
  - For each photo: unwrap DEK with UMK; wrap DEK with SK; encrypt filename with SK; store in share tables.
  - Non‑PIN shares: return share URL with `#k=...` fragment containing SK.
  - PIN shares: store SK encrypted under PIN-derived key in DB.
  - **Repo touchpoints**:
    - Web share routes: `apps/web/app/api/shared/*`
    - Share UI: `apps/web/components/share/*`
- [ ] **Share view (recipient)**
  - Non‑PIN: read SK from URL fragment.
  - PIN: prompt for PIN; derive key; decrypt SK locally.
  - Use SK to unwrap per-photo DEKs and decrypt filenames + bytes locally.
  - **Repo touchpoints**:
    - Web shared pages: `apps/web/app/shared/[token]/*`
    - Mobile shared views: `apps/mobile/src/components/shared-photo-view.tsx`, `apps/mobile/src/lib/share-utils.ts`

**Acceptance criteria**
- Recipient UX remains “open link → (optional PIN) → view/download”.
- DB compromise does not reveal shared photo bytes or filenames.
- Server does not need the owner UMK to enable sharing.

---

### Phase 5 — QR login: session first, vault second
- [ ] Keep current QR session flows unchanged.
- [ ] Add “Vault Locked” UX after QR login if UMK not available locally:
  - Unlock options: password, recovery key, (optional future) device link.

**Acceptance criteria**
- QR login still works without password.
- Decryption is blocked until vault is unlocked.

---

### Phase 6 — Migration (existing photos + legacy shares)
- [ ] **Client-driven background migration**
  - For each legacy photo:
    - encrypt filename under UMK → populate encrypted filename fields
    - wrap legacy DEK under UMK → populate wrapped DEK fields
    - optionally re-upload to new random S3 key format to remove filename leakage in object key
- [ ] **Legacy share links**
  - Let existing shares continue until expiry (legacy).
  - New shares use SK model only.

**Acceptance criteria**
- After migration completes, DB+S3 compromise cannot decrypt photos+filenames for migrated items.

---

### Implementation notes / guardrails
- **Crypto versioning**: do not infer modes from IV length; store `encryption_version` explicitly.
- **Do not leak filenames via headers**:
  - Current download presign sets `ResponseContentDisposition` with the S3 key; ensure future download names come from client-decrypted filename, not server-provided names.
- **Key derivation**:
  - Use Argon2id (WASM on web; RN-compatible implementation on mobile).
  - Store KDF params with the wrapped UMK for future tuning/migration.


