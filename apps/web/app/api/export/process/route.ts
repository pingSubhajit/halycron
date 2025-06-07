import {NextRequest, NextResponse} from 'next/server'
import {ExportService} from '@/lib/export-service'
import {Receiver} from '@upstash/qstash'

const receiver = new Receiver({
	currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
	nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!
})

export async function POST(request: NextRequest) {
	try {
		// Verify the request is from QStash
		const signature = request.headers.get('upstash-signature')
		const body = await request.text()

		if (!signature) {
			return NextResponse.json({error: 'Missing signature'}, {status: 401})
		}

		const isValid = await receiver.verify({
			signature,
			body
		})

		if (!isValid) {
			return NextResponse.json({error: 'Invalid signature'}, {status: 401})
		}

		// Parse the job data
		const {jobId} = JSON.parse(body)

		if (!jobId) {
			return NextResponse.json({error: 'Missing jobId'}, {status: 400})
		}

		console.log(`Processing export job: ${jobId}`)

		// Process the export job
		await ExportService.processExportJob(jobId)

		return NextResponse.json({
			success: true,
			message: `Export job ${jobId} processed successfully`
		})

	} catch (error) {
		console.error('Export processing error:', error)

		return NextResponse.json({
			error: 'Failed to process export job',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, {status: 500})
	}
}
