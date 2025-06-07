import {NextRequest, NextResponse} from 'next/server'
import {generatePresignedUploadUrl} from '@/lib/s3-client'
import {auth} from '@/lib/auth/config'
import {z} from 'zod'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {photo} from '@/db/schema'
import {count, eq} from 'drizzle-orm'

const requestSchema = z.object({
	fileName: z.string(),
	contentType: z.string().regex(
		/^(image\/(jpeg|png|jpg|heic|heif|avif|avis|webp|raw|arw|cr2|nef|orf|rw2)|application\/octet-stream)$/,
		'Unsupported image format'
	)
})

export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Check if user email is verified and photo count limit for unverified users
		if (!session.user.emailVerified) {
			// Count user's existing photos
			const photoCountResult = await db
				.select({count: count()})
				.from(photo)
				.where(eq(photo.userId, session.user.id))

			const userPhotoCount = photoCountResult[0]?.count || 0

			/*
			 * Grandfathering policy: if user already has >10 photos, give them 50 photo limit
			 * Otherwise, stick to 10 photo limit
			 */
			const photoLimit = userPhotoCount > 10 ? 50 : 10

			if (userPhotoCount >= photoLimit) {
				const limitMessage = photoLimit === 50
					? 'You\'ve reached your grandfathered limit of 50 photos. Please verify your email to upload unlimited photos.'
					: 'Email verification required. Please verify your email to upload more than 10 photos.'

				return NextResponse.json({
					error: limitMessage,
					code: 'EMAIL_VERIFICATION_REQUIRED',
					currentCount: userPhotoCount,
					limit: photoLimit
				}, {status: 403})
			}
		}

		const body = await req.json()
		const result = requestSchema.safeParse(body)

		if (!result.success) {
			return NextResponse.json(
				{error: 'Invalid request body'},
				{status: 400}
			)
		}

		const {fileName, contentType} = result.data

		const {uploadUrl, fileKey} = await generatePresignedUploadUrl(
			session.user.id,
			fileName,
			contentType
		)

		return NextResponse.json({uploadUrl, fileKey})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
