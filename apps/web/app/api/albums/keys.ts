export const albumQueryKeys = {
	allAlbums: () => ['albums'],
	album: (id: string) => ['album', {id}],
	albumPhotos: (id: string) => ['album', {id}, 'photos']
} 