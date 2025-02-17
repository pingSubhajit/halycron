import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

// Initialize S3 Client
export const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
	}
})

// Generate a unique file key
export const generateUniqueFileKey = (userId: string, fileName: string) => {
	const timestamp = Date.now()
	const randomString = crypto.randomBytes(8).toString('hex')
	const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
	return `${userId}/${timestamp}-${randomString}-${sanitizedFileName}`
}

// Generate presigned URL for upload
export const generatePresignedUploadUrl = async (
	userId: string,
	fileName: string,
	contentType: string
) => {
	const fileKey = generateUniqueFileKey(userId, fileName)

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: fileKey,
		ContentType: contentType,
		ServerSideEncryption: 'AES256'
	})

	const signedUrl = await getSignedUrl(s3Client, command, {
		expiresIn: 3600 // URL expires in 1 hour
	})

	return {
		uploadUrl: signedUrl,
		fileKey
	}
}

// Generate presigned URL for download
export const generatePresignedDownloadUrl = async (fileKey: string) => {
	const command = new GetObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: fileKey,
		ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileKey)}"`
	})

	return await getSignedUrl(s3Client, command, {
		expiresIn: 3600 // URL expires in 1 hour
	})
}
