import {relations} from 'drizzle-orm'
import {album, photo, photosToAlbums} from './schema'

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