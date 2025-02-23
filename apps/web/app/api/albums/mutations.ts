import {MutationOptions, useMutation, useQueryClient} from '@tanstack/react-query'
import {Album, PhotoToAlbum} from './types'
import {albumQueryKeys} from './keys'
import {api} from '@/lib/data/api-client'
import {Photo} from '../photos/types'

type CreateAlbumInput = {
	name: string
	isSensitive?: boolean
	isProtected?: boolean
}

type AddPhotosToAlbumInput = {
	albumId: string
	photoIds: string[]
}

type RemovePhotosFromAlbumInput = {
	albumId: string
	photoIds: string[]
}

type UpdateAlbumContext = {
	previousAlbum: Album | undefined
}

type AddPhotosContext = {
	previousPhotos: Photo[] | undefined
}

export const useCreateAlbum = (options?: MutationOptions<Album, Error, CreateAlbumInput>) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: CreateAlbumInput) => {
			return api.post<Album>('/api/albums', input)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
		},
		...options
	})
}

export const useUpdateAlbum = (options?: MutationOptions<Album, Error, Album, UpdateAlbumContext>) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (album: Album) => {
			return api.patch<Album>(`/api/albums/${album.id}`, album)
		},
		onMutate: async (album) => {
			await queryClient.cancelQueries({queryKey: albumQueryKeys.album(album.id)})
			const previousAlbum = queryClient.getQueryData<Album>(albumQueryKeys.album(album.id))

			queryClient.setQueryData<Album>(albumQueryKeys.album(album.id), album)

			return {previousAlbum}
		},
		onError: (err, album, context) => {
			if (context?.previousAlbum) {
				queryClient.setQueryData(albumQueryKeys.album(album.id), context.previousAlbum)
			}
		},
		onSettled: (album) => {
			if (album) {
				queryClient.invalidateQueries({queryKey: albumQueryKeys.album(album.id)})
				queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
			}
		},
		...options
	})
}

export const useDeleteAlbum = (options?: MutationOptions<void, Error, string>) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (albumId: string) => {
			await api.delete(`/api/albums/${albumId}`)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
		},
		...options
	})
}

export const useAddPhotosToAlbum = (options?: MutationOptions<PhotoToAlbum[], Error, AddPhotosToAlbumInput, AddPhotosContext>) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({albumId, photoIds}: AddPhotosToAlbumInput) => {
			return api.post<PhotoToAlbum[]>(`/api/albums/${albumId}/photos`, {photoIds})
		},
		onMutate: async ({albumId, photoIds}) => {
			await queryClient.cancelQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
			const previousPhotos = queryClient.getQueryData<Photo[]>(albumQueryKeys.albumPhotos(albumId))

			// Optimistically update the photos in the album
			if (previousPhotos) {
				const newPhotos = [...previousPhotos]
				photoIds.forEach(photoId => {
					const photo = queryClient.getQueryData<Photo>(['photo', {id: photoId}])
					if (photo && !newPhotos.find(p => p.id === photoId)) {
						newPhotos.push(photo)
					}
				})
				queryClient.setQueryData<Photo[]>(albumQueryKeys.albumPhotos(albumId), newPhotos)
			}

			return {previousPhotos}
		},
		onError: (err, {albumId}, context) => {
			if (context?.previousPhotos) {
				queryClient.setQueryData(albumQueryKeys.albumPhotos(albumId), context.previousPhotos)
			}
		},
		onSettled: (_, __, {albumId}) => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(albumId)})
		},
		...options
	})
}

export const useRemovePhotosFromAlbum = (options?: MutationOptions<void, Error, RemovePhotosFromAlbumInput, AddPhotosContext>) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({albumId, photoIds}: RemovePhotosFromAlbumInput) => {
			await api.delete(`/api/albums/${albumId}/photos`, {body: {photoIds}})
		},
		onMutate: async ({albumId, photoIds}) => {
			await queryClient.cancelQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
			const previousPhotos = queryClient.getQueryData<Photo[]>(albumQueryKeys.albumPhotos(albumId))

			// Optimistically remove the photos from the album
			if (previousPhotos) {
				const newPhotos = previousPhotos.filter(photo => !photoIds.includes(photo.id))
				queryClient.setQueryData<Photo[]>(albumQueryKeys.albumPhotos(albumId), newPhotos)
			}

			return {previousPhotos}
		},
		onError: (err, {albumId}, context) => {
			if (context?.previousPhotos) {
				queryClient.setQueryData(albumQueryKeys.albumPhotos(albumId), context.previousPhotos)
			}
		},
		onSettled: (_, __, {albumId}) => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(albumId)})
		},
		...options
	})
} 