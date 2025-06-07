import {Client} from '@upstash/qstash'

let qstashClient: Client | null = null

/**
 * Get QStash client with lazy initialization
 * Better for serverless: only creates client when needed
 */
export const getQStashClient = () => {
	if (!qstashClient) {
		const token = process.env.QSTASH_TOKEN

		if (!token) {
			throw new Error('QSTASH_TOKEN environment variable is required')
		}

		qstashClient = new Client({token})
	}

	return qstashClient
}

/**
 * Reset client (useful for testing or error recovery)
 */
export const resetQStashClient = () => {
	qstashClient = null
}

// Helper function to get the current base URL
export const getBaseUrl = () => {
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`
	}
	return process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
}

// Schedule cleanup CRON job (runs daily at 2 AM)
export const scheduleCleanupJob = async () => {
	const client = getQStashClient()
	const baseUrl = getBaseUrl()
	const endpoint = `${baseUrl}/api/cron/cleanup-exports`

	try {
		await client.schedules.create({
			destination: endpoint,
			cron: '0 2 * * *', // Daily at 2 AM
			scheduleId: 'export-cleanup-daily'
		})
		console.log('Cleanup CRON job scheduled successfully')
	} catch (error) {
		console.error('Failed to schedule cleanup CRON job:', error)
		throw error // Re-throw for proper error handling
	}
}

// Queue background export job
export const queueExportJob = async (jobId: string) => {
	const client = getQStashClient()
	const baseUrl = getBaseUrl()
	const endpoint = `${baseUrl}/api/export/process`

	return await client.publishJSON({
		url: endpoint,
		body: {jobId},
		headers: {
			'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`
		}
	})
}
