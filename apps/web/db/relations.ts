import {relations} from 'drizzle-orm'
import {album, photo, photosToAlbums, sharedAlbums, sharedLink, sharedPhotos} from '@/db/schema'

export const photoRelations = relations(photo, ({many}) => ({
	albums: many(photosToAlbums)
}))

export const albumRelations = relations(album, ({many}) => ({
	photos: many(photosToAlbums)
}))

export const photosToAlbumsRelations = relations(photosToAlbums, ({one}) => ({
	photo: one(photo, {
		fields: [photosToAlbums.photoId],
		references: [photo.id]
	}),
	album: one(album, {
		fields: [photosToAlbums.albumId],
		references: [album.id]
	})
}))

// Shared Link Relations
export const sharedLinkRelations = relations(sharedLink, ({many}) => ({
	photos: many(sharedPhotos),
	albums: many(sharedAlbums)
}))

// Shared Photos Relations
export const sharedPhotosRelations = relations(sharedPhotos, ({one}) => ({
	sharedLink: one(sharedLink, {
		fields: [sharedPhotos.sharedLinkId],
		references: [sharedLink.id]
	}),
	photo: one(photo, {
		fields: [sharedPhotos.photoId],
		references: [photo.id]
	})
}))

// Shared Albums Relations
export const sharedAlbumsRelations = relations(sharedAlbums, ({one}) => ({
	sharedLink: one(sharedLink, {
		fields: [sharedAlbums.sharedLinkId],
		references: [sharedLink.id]
	}),
	album: one(album, {
		fields: [sharedAlbums.albumId],
		references: [album.id]
	})
}))
