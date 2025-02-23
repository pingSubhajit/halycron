import {z} from 'zod'

export const createAlbumSchema = z.object({
	name: z.string().min(1),
	isSensitive: z.boolean().default(false),
	isProtected: z.boolean().default(false),
	pin: z.string().length(4).regex(/^\d+$/).optional()
})

export const updateAlbumSchema = z.object({
	name: z.string().min(1).optional(),
	isSensitive: z.boolean().optional(),
	isProtected: z.boolean().optional(),
	pin: z.string().length(4).regex(/^\d+$/).optional()
})

export const verifyPinSchema = z.object({
	pin: z.string().length(4).regex(/^\d+$/)
})

export const addPhotosToAlbumSchema = z.object({
	photoIds: z.array(z.string().uuid())
})

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>
export type VerifyPinInput = z.infer<typeof verifyPinSchema>
export type AddPhotosToAlbumInput = z.infer<typeof addPhotosToAlbumSchema>

export type Album = {
	id: string
	name: string
	isSensitive: boolean
	isProtected: boolean
	createdAt: Date | null
	updatedAt: Date | null
}

export type PhotoToAlbum = {
	photoId: string
	albumId: string
	createdAt: Date | null
}
