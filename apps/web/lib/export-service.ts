import {db} from '@/db/drizzle'
import {album, exportJob, photo, sharedLink, user} from '@/db/schema'
import {eq, sql} from 'drizzle-orm'
import {deleteS3Object, generatePresignedDownloadUrl, s3Client} from '@/lib/s3-client'
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3'
import {sendExportReadyEmail} from '@/lib/email/resend-client'
import {queueExportJob} from '@/lib/qstash-client'
import archiver from 'archiver'
import {generateDecryptionTool} from '@/lib/html-decryption-tool'

export type ExportJobStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'expired'

export type ExportJobData = {
	id: string
	status: ExportJobStatus
	createdAt: string
	downloadUrl?: string
	expiresAt?: string
	totalPhotos: number
	processedPhotos: number
	errorMessage?: string
}

export class ExportService {

	/**
	 * Create a new export job
	 */
	static async createExportJob(userId: string): Promise<ExportJobData> {
		// Get total photo count for progress tracking
		const photoCount = await db
			.select({count: sql<number>`COUNT(*)`})
			.from(photo)
			.where(eq(photo.userId, userId))

		const totalPhotos = Number(photoCount[0]?.count || 0)
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

		const [newJob] = await db.insert(exportJob).values({
			userId,
			status: 'pending',
			totalPhotos,
			processedPhotos: 0,
			expiresAt
		}).returning()

		if (!newJob) {
			throw new Error('Failed to create export job')
		}

		// Queue background processing with QStash
		try {
			await queueExportJob(newJob.id)
		} catch (error) {
			console.error('Failed to queue export job:', error)
			await this.updateJobStatus(newJob.id, 'failed', 'Failed to queue background job')
		}

		return this.formatJobData(newJob)
	}

	/**
	 * Get export job status
	 */
	static async getExportJob(jobId: string): Promise<ExportJobData | null> {
		const [job] = await db
			.select()
			.from(exportJob)
			.where(eq(exportJob.id, jobId))
			.limit(1)

		if (!job) return null

		return this.formatJobData(job)
	}

	/**
	 * Process export job in background (called by QStash)
	 */
	static async processExportJob(jobId: string): Promise<void> {
		await this.updateJobStatus(jobId, 'processing')

		const [job] = await db
			.select()
			.from(exportJob)
			.where(eq(exportJob.id, jobId))
			.limit(1)

		if (!job) throw new Error('Export job not found')

		try {
			// 1. Fetch all user data
			const [photos, albums, sharedLinks, userData] = await Promise.all([
				db.query.photo.findMany({
					where: eq(photo.userId, job.userId),
					with: {
						albums: {
							with: {
								album: true
							}
						}
					}
				}),
				db.query.album.findMany({
					where: eq(album.userId, job.userId)
				}),
				db.query.sharedLink.findMany({
					where: eq(sharedLink.userId, job.userId),
					with: {
						photos: {
							with: {
								photo: true
							}
						},
						albums: {
							with: {
								album: true
							}
						}
					}
				}),
				db.query.user.findFirst({
					where: eq(user.id, job.userId)
				})
			])

			// 2. Generate export package
			const exportPackage = await this.createExportPackage(
				photos,
				albums,
				sharedLinks,
				userData,
				jobId,
				(progress) => this.updateJobProgress(jobId, progress)
			)

			// 3. Upload to S3
			const s3Key = `exports/${job.userId}/${jobId}/export.zip`
			const uploadCommand = new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: s3Key,
				Body: exportPackage,
				ContentType: 'application/zip',
				ServerSideEncryption: 'AES256', // Required by bucket policy
				// Set object to expire after 7 days
				Expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
			})

			await s3Client.send(uploadCommand)

			// 4. Generate download URL
			const downloadUrl = await generatePresignedDownloadUrl(s3Key)

			// 5. Update job status
			await db.update(exportJob)
				.set({
					status: 'ready',
					downloadUrl,
					s3Key,
					updatedAt: new Date()
				})
				.where(eq(exportJob.id, jobId))

			// 6. Send email notification
			if (userData?.email) {
				try {
					await sendExportReadyEmail({
						to: userData.email,
						downloadUrl,
						userName: userData.name || 'User',
						totalPhotos: photos.length,
						expiresAt: job.expiresAt?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
					})
				} catch (emailError) {
					// Don't fail the entire export if email fails
					console.error('Failed to send export ready email:', emailError)
				}
			}

		} catch (error) {
			console.error('Export processing failed:', error)
			await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
		}
	}

	/**
	 * Create the export package (ZIP file)
	 */
	private static async createExportPackage(
		photos: any[],
		albums: any[],
		sharedLinks: any[],
		userData: any,
		jobId: string,
		onProgress: (processed: number) => void
	): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			const archive = archiver('zip', {
				zlib: {level: 9} // Best compression
			})

			const chunks: Buffer[] = []

			archive.on('data', (chunk) => {
				chunks.push(chunk)
			})

			archive.on('end', () => {
				resolve(Buffer.concat(chunks))
			})

			archive.on('error', (err) => {
				reject(err)
			})

			// Create manifest with photo metadata
			const manifest = {
				version: '1.0',
				generatedAt: new Date().toISOString(),
				userId: userData?.id,
				totalPhotos: photos.length,
				totalAlbums: albums.length,
				encryption: {
					algorithm: 'AES-256-GCM',
					keyDerivation: 'PBKDF2'
				},
				photos: photos.map(photo => ({
					id: photo.id,
					originalFilename: photo.originalFilename,
					mimeType: photo.mimeType,
					imageWidth: photo.imageWidth,
					imageHeight: photo.imageHeight,
					createdAt: photo.createdAt,
					s3Key: photo.s3Key,
					encryptedFileKey: photo.encryptedFileKey,
					fileKeyIv: photo.fileKeyIv,
					encryptedMetadata: photo.encryptedMetadata,
					metadataIv: photo.metadataIv,
					albums: photo.albums?.map((pa: any) => ({
						id: pa.album.id,
						name: pa.album.name
					})) || []
				})),
				albums: albums.map(album => ({
					id: album.id,
					name: album.name,
					isSensitive: album.isSensitive,
					isProtected: album.isProtected,
					createdAt: album.createdAt
				})),
				sharedLinks: sharedLinks.map(link => ({
					id: link.id,
					token: link.token,
					isPinProtected: link.isPinProtected,
					expiresAt: link.expiresAt,
					createdAt: link.createdAt,
					photos: link.photos?.map((sp: any) => sp.photo.id) || [],
					albums: link.albums?.map((sa: any) => sa.album.id) || []
				}))
			}

			// Add manifest file
			archive.append(JSON.stringify(manifest, null, 2), {name: 'manifest.json'})

			// Add decryption tool
			archive.append(generateDecryptionTool(), {name: 'decrypt-photos.html'})

			// Add README
			const readme = `# Halycron Photo Export

This package contains your encrypted photos and data from Halycron.

## Contents:
- \`manifest.json\`: Metadata about your photos and albums
- \`decrypt-photos.html\`: Standalone decryption tool (open in any browser)
- \`photos/\`: Your encrypted photo files
- \`README.md\`: This file

## How to decrypt your photos:

1. Extract this ZIP file to a folder
2. Open \`decrypt-photos.html\` in any modern web browser
3. Load the \`manifest.json\` file when prompted
4. Select the \`photos/\` folder when prompted
5. Click "Start Decryption" to process all photos
6. Click on any decrypted photo to download it

## Security Notice:
- All decryption happens locally in your browser
- Your photos never leave your device during decryption
- You can use this tool offline

## Support:
For help with your export, contact support at support@halycron.space

Generated: ${new Date().toISOString()}
Total Photos: ${photos.length}
`
			archive.append(readme, {name: 'README.md'})

			// Process photos - fetch actual encrypted files from S3
			this.processPhotosForExport(archive, photos, onProgress)
				.then(() => {
					// Finalize the archive after all photos are processed
					archive.finalize()
				})
				.catch((error: Error) => {
					archive.destroy(error)
				})
		})
	}

	/**
	 * Process photos for export - fetch encrypted files from S3 and add to archive
	 */
	private static async processPhotosForExport(
		archive: any,
		photos: any[],
		onProgress: (processed: number) => void
	): Promise<void> {
		for (let i = 0; i < photos.length; i++) {
			const photo = photos[i]

			try {
				// Fetch encrypted photo from S3
				const getCommand = new GetObjectCommand({
					Bucket: process.env.AWS_BUCKET_NAME,
					Key: photo.s3Key
				})

				const response = await s3Client.send(getCommand)

				if (response.Body) {
					// Convert stream to buffer
					const chunks: Uint8Array[] = []
					const reader = response.Body.transformToWebStream().getReader()

					while (true) {
						const {done, value} = await reader.read()
						if (done) break
						chunks.push(value)
					}

					const photoBuffer = Buffer.concat(chunks)

					// Add encrypted photo to archive
					archive.append(photoBuffer, {
						name: `photos/${photo.originalFilename}`
					})
				}
			} catch (error) {
				console.error(`Failed to fetch photo ${photo.s3Key}:`, error)
				// Continue with other photos even if one fails
			}

			// Update progress
			onProgress(i + 1)
		}
	}

	/**
	 * Update job status
	 */
	private static async updateJobStatus(jobId: string, status: ExportJobStatus, errorMessage?: string): Promise<void> {
		await db.update(exportJob)
			.set({
				status,
				errorMessage,
				updatedAt: new Date()
			})
			.where(eq(exportJob.id, jobId))
	}

	/**
	 * Update job progress
	 */
	private static async updateJobProgress(jobId: string, processedPhotos: number): Promise<void> {
		await db.update(exportJob)
			.set({
				processedPhotos,
				updatedAt: new Date()
			})
			.where(eq(exportJob.id, jobId))
	}


	/**
	 * Clean up expired export jobs
	 */
	static async cleanupExpiredJobs(): Promise<void> {
		const expiredJobs = await db
			.select()
			.from(exportJob)
			.where(sql`expires_at < NOW()`)

		for (const job of expiredJobs) {
			// Delete from S3 if exists
			if (job.s3Key) {
				try {
					await deleteS3Object(job.s3Key)
					console.log(`Deleted S3 object: ${job.s3Key}`)
				} catch (error) {
					console.error('Failed to delete S3 object:', error)
				}
			}

			// Update status to expired
			await db.update(exportJob)
				.set({status: 'expired', updatedAt: new Date()})
				.where(eq(exportJob.id, job.id))
		}
	}

	/**
	 * Format job data for API response
	 */
	private static formatJobData(job: any): ExportJobData {
		return {
			id: job.id,
			status: job.status,
			createdAt: job.createdAt.toISOString(),
			downloadUrl: job.downloadUrl,
			expiresAt: job.expiresAt?.toISOString(),
			totalPhotos: job.totalPhotos,
			processedPhotos: job.processedPhotos,
			errorMessage: job.errorMessage
		}
	}
}
