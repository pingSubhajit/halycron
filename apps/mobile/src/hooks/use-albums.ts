import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {
	albumQueryKeys,
	getAllAlbums,
	getAlbum,
	createAlbum,
	updateAlbum,
	deleteAlbum,
	getAlbumPhotos,
	addPhotosToAlbum,
	removePhotosFromAlbum,
	verifyAlbumPin,
	lockAlbum,
	isAlbumVerified
} from '../lib/album-api'
import {
	Album,
	CreateAlbumInput,
	UpdateAlbumInput,
	VerifyPinInput
} from '../lib/album-types'
import {Photo} from '../lib/types'
import {photoQueryKeys} from '../lib/photo-keys'

// Query hooks

export const useAllAlbums = () => {
	return useQuery({
		queryKey: albumQueryKeys.allAlbums(),
		queryFn: getAllAlbums
	})
}

export const useAlbum = (id: string, enabled: boolean = true) => {
	return useQuery({
		queryKey: albumQueryKeys.album(id),
		queryFn: () => getAlbum(id),
		enabled: enabled && !!id
	})
}

export const useAlbumPhotos = (albumId: string, enabled: boolean = true) => {
	return useQuery({
		queryKey: albumQueryKeys.albumPhotos(albumId),
		queryFn: () => getAlbumPhotos(albumId),
		enabled: enabled && !!albumId
	})
}

// Mutation hooks

export const useCreateAlbum = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: CreateAlbumInput) => createAlbum(input),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
		}
	})
}

export const useUpdateAlbum = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: UpdateAlbumInput) => updateAlbum(input),
		onMutate: async (input) => {
			await queryClient.cancelQueries({queryKey: albumQueryKeys.album(input.id)})
			const previousAlbum = queryClient.getQueryData<Album>(
				albumQueryKeys.album(input.id)
			)

			if (previousAlbum) {
				queryClient.setQueryData<Album>(albumQueryKeys.album(input.id), {
					...previousAlbum,
					...input
				})
			}

			return {previousAlbum}
		},
		onError: (err, input, context) => {
			if (context?.previousAlbum) {
				queryClient.setQueryData(
					albumQueryKeys.album(input.id),
					context.previousAlbum
				)
			}
		},
		onSettled: (_, __, input) => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(input.id)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
		}
	})
}

export const useDeleteAlbum = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (albumId: string) => deleteAlbum(albumId),
		onMutate: async (albumId) => {
			await queryClient.cancelQueries({queryKey: albumQueryKeys.allAlbums()})
			const previousAlbums = queryClient.getQueryData<Album[]>(
				albumQueryKeys.allAlbums()
			)

			if (previousAlbums) {
				queryClient.setQueryData<Album[]>(
					albumQueryKeys.allAlbums(),
					previousAlbums.filter((album) => album.id !== albumId)
				)
			}

			return {previousAlbums}
		},
		onError: (err, albumId, context) => {
			if (context?.previousAlbums) {
				queryClient.setQueryData(albumQueryKeys.allAlbums(), context.previousAlbums)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
		}
	})
}

export const useAddPhotosToAlbum = (relatedAlbumIds?: string[]) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({albumId, photoIds}: {albumId: string; photoIds: string[]}) =>
			addPhotosToAlbum(albumId, photoIds),
		onSuccess: (_, {albumId}) => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
			queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})

			// Invalidate related albums if provided
			if (relatedAlbumIds) {
				relatedAlbumIds.forEach((id) => {
					queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(id)})
				})
			}
		}
	})
}

export const useRemovePhotosFromAlbum = (relatedAlbumIds?: string[]) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({albumId, photoIds}: {albumId: string; photoIds: string[]}) =>
			removePhotosFromAlbum(albumId, photoIds),
		onMutate: async ({albumId, photoIds}) => {
			await queryClient.cancelQueries({
				queryKey: albumQueryKeys.albumPhotos(albumId)
			})
			const previousPhotos = queryClient.getQueryData<Photo[]>(
				albumQueryKeys.albumPhotos(albumId)
			)

			if (previousPhotos) {
				queryClient.setQueryData<Photo[]>(
					albumQueryKeys.albumPhotos(albumId),
					previousPhotos.filter((photo) => !photoIds.includes(photo.id))
				)
			}

			return {previousPhotos}
		},
		onError: (err, {albumId}, context) => {
			if (context?.previousPhotos) {
				queryClient.setQueryData(
					albumQueryKeys.albumPhotos(albumId),
					context.previousPhotos
				)
			}
		},
		onSettled: (_, __, {albumId}) => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.allAlbums()})
			queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})

			// Invalidate related albums if provided
			if (relatedAlbumIds) {
				relatedAlbumIds.forEach((id) => {
					queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(id)})
				})
			}
		}
	})
}

export const useVerifyAlbumPin = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({albumId, pin}: {albumId: string; pin: string}) =>
			verifyAlbumPin(albumId, {pin}),
		onSuccess: (_, {albumId}) => {
			// Refetch album data after successful verification
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
		}
	})
}

export const useLockAlbum = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (albumId: string) => lockAlbum(albumId),
		onSuccess: (_, albumId) => {
			queryClient.invalidateQueries({queryKey: albumQueryKeys.album(albumId)})
			queryClient.invalidateQueries({queryKey: albumQueryKeys.albumPhotos(albumId)})
		}
	})
}

// Utility hook to check if an album is verified
export const useIsAlbumVerified = (albumId: string): boolean => {
	return isAlbumVerified(albumId)
}

