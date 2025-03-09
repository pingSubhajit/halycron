import {z} from 'zod'

export const createAlbumSchema = z.object({
	name: z.string().min(1),
	isSensitive: z.boolean().default(false),
	isProtected: z.boolean().default(false),
	pin: z.string().length(4).regex(/^\d+$/).optional()
}).refine(data => {
	// If isProtected is true, pin must be provided
	return !data.isProtected || (data.isProtected && !!data.pin);
}, {
	message: "PIN is required when album is protected",
	path: ["pin"]
})

export const updateAlbumSchema = z.object({
	name: z.string().min(1).optional(),
	isSensitive: z.boolean().optional(),
	isProtected: z.boolean().optional(),
	pin: z.string().length(4).regex(/^\d+$/).optional()
}).refine(data => {
	// If isProtected is being set to true, pin must be provided
	return !data.isProtected || (data.isProtected && !!data.pin);
}, {
	message: "PIN is required when album is protected",
	path: ["pin"]
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
	_count?: {
		photos: number
	}
}

export type PhotoToAlbum = {
	photoId: string
	albumId: string
	createdAt: Date | null
}
