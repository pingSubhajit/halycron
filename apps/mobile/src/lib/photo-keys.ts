export const photoQueryKeys = {
	allPhotos: () => ['photos'],
	photo: (id: string) => ['photo', {id}]
}
