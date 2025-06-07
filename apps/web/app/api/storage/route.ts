import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {photo} from '@/db/schema'
import {eq, sql} from 'drizzle-orm'

export type StorageStats = {
	used: number // GB
	total: number // GB
	photos: number
	storageType: 'halycron' | 'custom-s3'
}

export const GET = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		// Get total photos count for the user
		const photoCountResult = await db
			.select({count: sql<number>`COUNT(*)`})
			.from(photo)
			.where(eq(photo.userId, session.user.id))

		const photoCount = Number(photoCountResult[0]?.count || 0)

		/*
		 * Calculate storage usage by querying S3 object sizes
		 * For now, we'll estimate based on average photo size (2MB per photo)
		 * TODO: In a real implementation, you would query S3 to get actual file sizes
		 */
		const averagePhotoSizeMB = 2
		const usedMB = photoCount * averagePhotoSizeMB
		const usedGB = usedMB / 1024

		/*
		 * TODO: Check user settings to determine if they're using custom S3
		 * For now, assume all users are on Halycron Cloud with 5GB limit
		 */
		const storageType = 'halycron' as const
		const totalGB = storageType === 'halycron' ? 5 : 100 // 5GB for Halycron, 100GB for custom S3

		const storageStats: StorageStats = {
			used: Math.round(usedGB * 100) / 100, // Round to 2 decimal places
			total: totalGB,
			photos: photoCount,
			storageType
		}

		return NextResponse.json(storageStats)
	} catch (error) {
		console.error('Storage stats error:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
