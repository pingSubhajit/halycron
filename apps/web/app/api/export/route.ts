import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {ExportJobData, ExportService} from '@/lib/export-service'

// Re-export types for backwards compatibility
export type ExportStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'expired'
export type ExportData = ExportJobData

export const POST = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const exportData = await ExportService.createExportJob(session.user.id)
		return NextResponse.json(exportData)

	} catch (error) {
		console.error('Export creation error:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

export const GET = async (req: NextRequest) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {searchParams} = new URL(req.url)
		const exportId = searchParams.get('exportId')

		if (exportId) {
			// Get specific export by ID
			const exportData = await ExportService.getExportJob(exportId)
			if (!exportData) {
				return NextResponse.json({error: 'Export not found'}, {status: 404})
			}
			return NextResponse.json(exportData)
		} else {
			// Get current user's active export
			const exportData = await ExportService.getCurrentUserExport(session.user.id)
			return NextResponse.json(exportData) // Will be null if no active export
		}
	} catch (error) {
		console.error('Export status error:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500}
		)
	}
}

