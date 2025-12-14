### Core crypto + key management (to justify “zero-knowledge / E2EE”)
- **Implement a real user “master key” system**:
  - Generate a **User Master Key (UMK)** client-side.
  - Derive a **Key Encryption Key (KEK)** from the user’s password with **Argon2id** (not PBKDF2) and strong parameters.
  - **Wrap (encrypt) the UMK with the KEK**, store only the wrapped UMK (+ salt/params) server-side.
- **Wrap per-file Data Encryption Keys (DEKs)**:
  - Generate a random per-file **DEK** for AES-GCM encryption.
  - **Encrypt/wrap the DEK with the UMK** and store only the wrapped DEK in DB (your `encryptedFileKey` should actually be encrypted).
- **Add crypto versioning**:
  - Store `encryptionVersion`, `alg`, `iv`, `tag`/layout in DB so migration and compatibility are explicit (not inferred from IV length).
- **Metadata encryption**:
  - Encrypt sensitive metadata (EXIF-derived fields, filenames if desired, tags, album names if you claim it) with UMK using **AES-GCM**.
  - Ensure server never receives plaintext metadata you claim is private.
- **Key rotation + recovery**:
  - Define and implement rotation strategy for UMK/KEK (password change flow must rewrap UMK).
  - Add recovery policy (backup codes, recovery key, or “no recovery” explicitly documented).

### Authentication/session security
- **Session hardening**:
  - Confirm cookie flags everywhere: `HttpOnly`, `Secure`, `SameSite=Strict/Lax`, short TTL, rotation on privilege changes.
  - Add **session binding** (device fingerprint/user-agent hash + IP heuristics) if appropriate.
- **2FA posture**:
  - Enforce 2FA on sensitive actions (export, sharing, password change, security settings), not just login gating.
- **Brute-force protections**:
  - Rate-limit + lockouts for: login, 2FA, album PIN, shared-link PIN, QR login approvals.
  - Add progressive delays and alerting.

### PIN and sharing security (current weak spot)
- **Replace SHA-256 PIN hashing** for share links with a slow password hash:
  - Use **Argon2id** (preferred) or at least **bcrypt** with correct parameters.
  - Store per-record salt automatically via the hash format.
- **Share-link access control**:
  - If PIN-protected, avoid returning full metadata before verification.
  - Add attempt counters + temporary lockouts per token.

### Storage & data access
- **Presigned URL controls**:
  - Ensure short expirations, scope to exact object key, correct content-type constraints, and least-privilege IAM.
  - Consider separate buckets/prefixes per tenant and strict bucket policies.
- **Server-side authorization**:
  - Validate every photo/album/share request against ownership and protection state (including “sensitive album” rules).
- **Deletion semantics**:
  - If you claim deletion, implement secure deletion expectations clearly (S3 versioning complicates “true delete”).

### Client hardening (web + mobile)
- **Web**:
  - Strong **CSP**, disable inline scripts where possible, strict `connect-src`, `frame-ancestors 'none'`.
  - Prevent token/key leakage in logs, error reports, query strings.
  - Reduce exposure of decrypted blobs (revoke URLs, memory limits, avoid caching decrypted data too long).
- **Mobile**:
  - Ensure keys/wrapped keys stored only in **SecureStore/Keychain/Keystore**.
  - Use screenshot/screen-record protections where feasible (you already have guards; verify coverage on sensitive screens).
  - Add jailbreak/root detection if your threat model requires it (optional, can be bypassed).

### Server/app security basics (must-haves)
- **Input validation everywhere** (already decent, ensure coverage across all endpoints).
- **CSRF**: confirm you’re protected if using cookie auth for API routes (SameSite alone may not be enough for all flows).
- **Audit logging**:
  - Log security-relevant events (logins, 2FA enable/disable, sharing created, export created, repeated PIN failures) without sensitive data.
- **Secrets management**:
  - Rotate keys, remove fallback secrets, enforce production-only configs, ensure no secrets in client bundles.

### Verification (to credibly claim security)
- **Threat model document**: clearly state what you protect against and what you don’t (XSS, compromised device, malicious browser extensions, etc.).
- **Independent security review**:
  - At minimum: a focused review on **crypto design + auth/session + sharing**.
  - Ideally: a small pentest + report.
- **Automated checks**:
  - Dependency scanning, SAST, secret scanning, and CI gates for high-risk changes.

If you tell me what “zero-knowledge” specifically means in your marketing (e.g., “server cannot decrypt photos even if DB+S3 compromised”), I can turn this into a prioritized, phase-by-phase checklist with acceptance criteria for each item.