import {NextRequest, NextResponse} from 'next/server'
import {ExportService} from '@/lib/export-service'

export const POST = async (req: NextRequest) => {
	try {
		// Verify the request is from a cron job (you might want to add authentication)
		const authHeader = req.headers.get('authorization')
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await ExportService.cleanupExpiredJobs()

		return NextResponse.json({
			success: true,
			message: 'Export cleanup completed'
		})
	} catch (error) {
		console.error('Export cleanup error:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}
