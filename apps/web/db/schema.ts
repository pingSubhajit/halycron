// import {waitlist, WaitlistInsert, WaitlistSelect} from '@/db/waitlist.schema'
import {boolean, integer, pgTable, primaryKey, text, timestamp, uuid, varchar} from 'drizzle-orm/pg-core'
import {sql} from 'drizzle-orm'

/*
 * export {
 * 	waitlist
 * }
 *
 * export {
 * 	WaitlistInsert, WaitlistSelect
 * }
 */


/*
 * Users Table
 * export const users = pgTable('users', {
 * 	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
 * 	email: varchar('email').notNull().unique(),
 * 	encryptedMasterKey: text('encrypted_master_key').notNull(),
 * 	masterKeyIv: text('master_key_iv').notNull(),
 * 	passwordHash: text('password_hash').notNull(),
 * 	mfaSecret: text('mfa_secret'),
 * 	mfaEnabled: boolean('mfa_enabled').default(false),
 * 	failedLoginAttempts: integer('failed_login_attempts').default(0),
 * 	lastLoginAt: timestamp('last_login_at', {withTimezone: true}),
 * 	passwordChangedAt: timestamp('password_changed_at', {withTimezone: true}).notNull(),
 * 	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
 * 	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
 * })
 */

export const user = pgTable('user', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name').notNull(),
	email: varchar('email').notNull(),
	emailVerified: boolean('email_verified').default(false),
	image: varchar('image'),
	/*
	 * encryptedUserKey: text('encrypted_user_key').notNull(),
	 * userKeyIv: text('user_key_iv').notNull(),
	 */
	twoFactorEnabled: boolean('two_factor_enabled').default(false),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

/**
 * User preferences (feature flags / user-configurable behavior).
 * One row per user (user_id is the PK) to keep it simple and future-proof.
 */
export const userPreferences = pgTable('user_preferences', {
	userId: uuid('user_id').primaryKey().references(() => user.id, {onDelete: 'cascade'}),
	/**
	 * If enabled, web app will sign the user out after a period of inactivity.
	 * Default is true to preserve current security behavior.
	 */
	inactivityAutoLogoutEnabled: boolean('inactivity_auto_logout_enabled').default(true).notNull(),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

/**
 * User key material for E2EE / zero-knowledge.
 *
 * IMPORTANT:
 * - Server stores only wrapped UMK blobs and KDF params.
 * - Recovery Key (RK) is never stored plaintext; it is only used client-side to unwrap UMK.
 */
export const userKeys = pgTable('user_keys', {
	userId: uuid('user_id').primaryKey().references(() => user.id, {onDelete: 'cascade'}),
	cryptoVersion: integer('crypto_version').notNull().default(1),

	// Password KDF (Argon2id) parameters and salt used to derive KEK_pw client-side.
	kdfSalt: text('kdf_salt').notNull(),
	kdfParams: text('kdf_params').notNull(), // JSON string

	// UMK wrapped with KEK_pw (XChaCha20-Poly1305 or AES-GCM; versioned in cryptoVersion/params)
	wrappedUmkPw: text('wrapped_umk_pw').notNull(),
	wrappedUmkPwIv: text('wrapped_umk_pw_iv').notNull(),

	// UMK wrapped with Recovery Key (RK) for password reset recovery
	wrappedUmkRk: text('wrapped_umk_rk').notNull(),
	wrappedUmkRkIv: text('wrapped_umk_rk_iv').notNull(),

	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

export const session = pgTable('session', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
	token: text('token').notNull(),
	expiresAt: timestamp('expires_at', {withTimezone: true}).notNull(),
	ipAddress: varchar('ip_address'),
	userAgent: varchar('user_agent'),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

export const account = pgTable('account', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
	accountId: varchar('account_id').notNull(),
	providerId: varchar('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', {withTimezone: true}),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {withTimezone: true}),
	scope: text('scope'),
	idToken: text('id_token'),
	password: text('password'),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

export const verification = pgTable('verification', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	identifier: varchar('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', {withTimezone: true}).notNull(),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

export const twoFactor = pgTable('two_factor', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid
    ()`),
	secret: text('secret'),
	backupCodes: text('backup_codes'),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'})
})

// Photos Table
export const photo = pgTable('photos', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
	/**
	 * Legacy (v0): plaintext per-photo key stored as base64 (NOT zero-knowledge).
	 * Kept temporarily for migration; should be NULL for v1+.
	 */
	encryptedFileKey: text('encrypted_file_key'),
	/**
	 * Legacy (v0): IV for photo byte encryption (hex).
	 * For v1+, use contentIv.
	 */
	fileKeyIv: text('file_key_iv'),
	s3Key: text('s3_key').notNull(),
	/**
	 * Legacy (v0): plaintext filename.
	 * For v1+, use encryptedFilename/filenameIv.
	 */
	originalFilename: text('original_filename'),
	mimeType: text('mime_type').notNull(),
	imageWidth: integer('image_width'),
	imageHeight: integer('image_height'),

	/**
	 * E2EE (v1) fields
	 */
	encryptionVersion: integer('encryption_version').notNull().default(0), // 0 = legacy, 1 = E2EE
	contentIv: text('content_iv'), // hex (12B for GCM)
	wrappedDek: text('wrapped_dek'), // base64
	wrappedDekIv: text('wrapped_dek_iv'), // base64/hex depending on encoding (versioned)
	encryptedFilename: text('encrypted_filename'), // base64
	filenameIv: text('filename_iv'), // base64/hex depending on encoding (versioned)

	encryptedMetadata: text('encrypted_metadata'),
	metadataIv: text('metadata_iv'),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})
//
// // Tags Table
// export const tag = pgTable('tags', {
// 	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
// 	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
// 	name: text('name').notNull(),
// 	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
// }, (t) => [
// 	unique().on(t.id, t.name)
// ])

// Albums Table
export const album = pgTable('albums', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
	name: text('name').notNull(),
	isSensitive: boolean('is_sensitive').default(false).notNull(),
	isProtected: boolean('is_protected').default(false).notNull(),
	pinHash: text('pin_hash'),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

// Junction table for photos and albums many-to-many relationship
export const photosToAlbums = pgTable('photos_to_albums', {
	photoId: uuid('photo_id').notNull().references(() => photo.id, {onDelete: 'cascade'}),
	albumId: uuid('album_id').notNull().references(() => album.id, {onDelete: 'cascade'}),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
}, (t) => ({
	pk: primaryKey(t.photoId, t.albumId)
}))

// Shared Links Table
export const sharedLink = pgTable('shared_links', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
	token: text('token').notNull().unique(),
	pinHash: text('pin_hash'),
	isPinProtected: boolean('is_pin_protected').default(false).notNull(),
	expiresAt: timestamp('expires_at', {withTimezone: true}).notNull(),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

/**
 * Share-link key material for PIN-protected shares.
 * For non-PIN shares, the Share Key (SK) lives only in the URL fragment (#k=...),
 * so the server never receives it and this table will not have a row.
 */
export const sharedLinkKeys = pgTable('shared_link_keys', {
	sharedLinkId: uuid('shared_link_id').primaryKey().references(() => sharedLink.id, {onDelete: 'cascade'}),

	// SK encrypted (wrapped) under a PIN-derived key (Argon2id). Stored only for PIN shares.
	skWrappedByPin: text('sk_wrapped_by_pin').notNull(),
	pinKdfSalt: text('pin_kdf_salt').notNull(),
	pinKdfParams: text('pin_kdf_params').notNull(), // JSON string
	skWrapIv: text('sk_wrap_iv').notNull(),

	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

// Junction table for shared photos
export const sharedPhotos = pgTable('shared_photos', {
	sharedLinkId: uuid('shared_link_id').notNull().references(() => sharedLink.id, {onDelete: 'cascade'}),
	photoId: uuid('photo_id').notNull().references(() => photo.id, {onDelete: 'cascade'}),
	// Share-specific wrapped DEK + encrypted filename (recipient uses Share Key (SK))
	wrappedDekForShare: text('wrapped_dek_for_share'),
	wrappedDekForShareIv: text('wrapped_dek_for_share_iv'),
	encryptedFilenameForShare: text('encrypted_filename_for_share'),
	filenameForShareIv: text('filename_for_share_iv'),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
}, (t) => ({
	pk: primaryKey(t.sharedLinkId, t.photoId)
}))

// Junction table for shared albums
export const sharedAlbums = pgTable('shared_albums', {
	sharedLinkId: uuid('shared_link_id').notNull().references(() => sharedLink.id, {onDelete: 'cascade'}),
	albumId: uuid('album_id').notNull().references(() => album.id, {onDelete: 'cascade'}),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
}, (t) => ({
	pk: primaryKey(t.sharedLinkId, t.albumId)
}))

// Export Jobs Table
export const exportJob = pgTable('export_jobs', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid
    ()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
	status: varchar('status', {length: 20}).notNull().default('pending'), // pending, processing, ready, failed, expired
	totalPhotos: integer('total_photos').notNull().default(0),
	processedPhotos: integer('processed_photos').notNull().default(0),
	downloadUrl: text('download_url'),
	s3Key: text('s3_key'), // Key for the export package in S3
	errorMessage: text('error_message'),
	expiresAt: timestamp('expires_at', {withTimezone: true}),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

// Privacy Settings Table
export const privacySettings = pgTable('privacy_settings', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid
    ()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}).unique(),
	stripLocationData: boolean('strip_location_data').default(false).notNull(),
	anonymizeTimestamps: boolean('anonymize_timestamps').default(false).notNull(),
	disableAnalytics: boolean('disable_analytics').default(false).notNull(),
	minimalServerLogs: boolean('minimal_server_logs').default(true).notNull(),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})

// QR Login Requests Table - for QR code based authentication
export const qrLoginRequest = pgTable('qr_login_requests', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	token: text('token').notNull().unique(),
	status: varchar('status', {length: 20}).notNull().default('pending'), // pending, approved, expired, cancelled
	userId: uuid('user_id').references(() => user.id, {onDelete: 'cascade'}),
	webSessionId: uuid('web_session_id').references(() => session.id, {onDelete: 'set null'}),
	approvedBySessionId: uuid('approved_by_session_id'),
	ipAddress: varchar('ip_address'),
	userAgent: text('user_agent'),
	expiresAt: timestamp('expires_at', {withTimezone: true}).notNull(),
	createdAt: timestamp('created_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', {withTimezone: true}).default(sql`CURRENT_TIMESTAMP`)
})
