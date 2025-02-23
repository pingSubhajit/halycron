import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {s3Client} from '@/lib/s3-client'
import {DeleteObjectCommand} from '@aws-sdk/client-s3'

export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})
		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {s3Key} = await req.json()
		if (!s3Key) {
			return NextResponse.json({error: 'S3 key is required'}, {status: 400})
		}

		// Delete from S3
		await s3Client.send(new DeleteObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: s3Key
		}))

		return NextResponse.json({success: true})
	} catch (error) {
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
