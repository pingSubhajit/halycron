import {NextRequest, NextResponse} from 'next/server'
import {generatePresignedDownloadUrl, generatePresignedUploadUrl} from '@/lib/s3-client'
import {auth} from '@/lib/auth/config'
import {z} from 'zod'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {user} from '@/db/schema'
import {eq} from 'drizzle-orm'

const uploadRequestSchema = z.object({
	fileName: z.string(),
	contentType: z.string().regex(
		/^image\/(jpeg|png|jpg|webp)$/,
		'Unsupported image format. Please use JPEG, PNG, or WebP.'
	)
})

// POST - Get presigned URL for profile picture upload
export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body = await req.json()
		const result = uploadRequestSchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request body', details: result.error.errors},
				{status: 400}
			)
		}

		const {fileName, contentType} = result.data

		// Generate unique filename for profile picture with profile-pictures prefix
		const fileExtension = fileName.split('.').pop()
		const profileFileName = `profile-picture.${fileExtension}`

		const {uploadUrl, fileKey} = await generatePresignedUploadUrl(
			`profile-pictures/${session.user.id}`,
			profileFileName,
			contentType
		)

		return NextResponse.json({uploadUrl, fileKey})
	} catch (error) {
		console.error('Profile picture upload URL generation failed:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

// GET - Get presigned URL for current profile picture
export const GET = async () => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Get user's current profile picture
		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
			columns: {
				image: true
			}
		})

		if (!currentUser?.image) {
			return NextResponse.json({imageUrl: null})
		}

		// Generate presigned URL
		const imageUrl = await generatePresignedDownloadUrl(currentUser.image)

		return NextResponse.json({imageUrl})
	} catch (error) {
		console.error('Failed to get profile picture URL:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

// PATCH - Update user's profile picture URL after successful upload
const updateRequestSchema = z.object({
	fileKey: z.string()
})

export const PATCH = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const body = await req.json()
		const result = updateRequestSchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request body', details: result.error.errors},
				{status: 400}
			)
		}

		const {fileKey} = result.data

		// Update user's image in database with the S3 file key
		const [updatedUser] = await db
			.update(user)
			.set({
				image: fileKey,
				updatedAt: new Date()
			})
			.where(eq(user.id, session.user.id))
			.returning()

		if (!updatedUser) {
			return NextResponse.json({error: 'Failed to update profile picture'}, {status: 500})
		}

		// Generate presigned URL for the uploaded image
		const imageUrl = updatedUser.image ? await generatePresignedDownloadUrl(updatedUser.image) : null

		return NextResponse.json({
			success: true,
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				image: imageUrl,
				emailVerified: updatedUser.emailVerified,
				createdAt: updatedUser.createdAt
			}
		})
	} catch (error) {
		console.error('Profile picture update failed:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
