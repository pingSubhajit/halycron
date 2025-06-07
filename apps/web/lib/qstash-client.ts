import {Client} from '@upstash/qstash'

if (!process.env.QSTASH_TOKEN) {
	throw new Error('QSTASH_TOKEN environment variable is required')
}

export const qstashClient = new Client({
	token: process.env.QSTASH_TOKEN
})

// Helper function to get the current base URL
export const getBaseUrl = () => {
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`
	}
	return process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
}

// Schedule cleanup CRON job (runs daily at 2 AM)
export const scheduleCleanupJob = async () => {
	const baseUrl = getBaseUrl()
	const endpoint = `${baseUrl}/api/cron/cleanup-exports`

	try {
		await qstashClient.schedules.create({
			destination: endpoint,
			cron: '0 2 * * *', // Daily at 2 AM
			scheduleId: 'export-cleanup-daily'
		})
		console.log('Cleanup CRON job scheduled successfully')
	} catch (error) {
		console.error('Failed to schedule cleanup CRON job:', error)
	}
}

// Queue background export job
export const queueExportJob = async (jobId: string) => {
	const baseUrl = getBaseUrl()
	const endpoint = `${baseUrl}/api/export/process`

	return await qstashClient.publishJSON({
		url: endpoint,
		body: {jobId},
		headers: {
			'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`
		}
	})
}
