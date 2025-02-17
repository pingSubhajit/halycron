import {NextRequest, NextResponse} from 'next/server'
import {generatePresignedUploadUrl} from '@/lib/s3-client'
import {auth} from '@/lib/auth/config'
import {z} from 'zod'
import {headers} from 'next/headers'

const requestSchema = z.object({
	fileName: z.string(),
	contentType: z.string().regex(/^image\/(jpeg|png|jpg|heic|raw)$/)
})

export async function POST(req: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
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
		console.error('Error generating upload URL:', error)
		return NextResponse.json(
			{error: 'Internal server error'},
			{status: 500}
		)
	}
}
