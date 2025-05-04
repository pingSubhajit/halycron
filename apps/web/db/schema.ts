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
	encryptedUserKey: text('encrypted_user_key'),
	userKeyIv: text('user_key_iv'),
	userKeySalt: text('user_key_salt'),
	twoFactorEnabled: boolean('two_factor_enabled').default(false),
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
	secret: text('secret'),
	backupCodes: text('backup_codes'),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'})
})

// Photos Table
export const photo = pgTable('photos', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
	encryptedFileKey: text('encrypted_file_key').notNull(),
	fileKeyIv: text('file_key_iv').notNull(),
	fileIv: text('file_iv').notNull(),
	s3Key: text('s3_key').notNull(),
	originalFilename: text('original_filename').notNull(),
	mimeType: text('mime_type').notNull(),
	imageWidth: integer('image_width'),
	imageHeight: integer('image_height'),
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

// Junction table for shared photos
export const sharedPhotos = pgTable('shared_photos', {
	sharedLinkId: uuid('shared_link_id').notNull().references(() => sharedLink.id, {onDelete: 'cascade'}),
	photoId: uuid('photo_id').notNull().references(() => photo.id, {onDelete: 'cascade'}),
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
