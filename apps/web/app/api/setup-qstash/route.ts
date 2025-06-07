import {NextRequest, NextResponse} from 'next/server'
import {setupQStashJobs} from '@/scripts/setup-qstash-cron'

export async function POST(request: NextRequest) {
	// Verify authorization (use a secret key)
	const auth = request.headers.get('Authorization')
	const expectedAuth = `Bearer ${process.env.SETUP_SECRET || process.env.CRON_SECRET}`

	if (!auth || auth !== expectedAuth) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})
	}

	// Ensure we're in production
	if (!process.env.VERCEL_URL && !process.env.BETTER_AUTH_URL?.includes('https')) {
		return NextResponse.json({
			error: 'Setup can only be run in production environment'
		}, {status: 400})
	}

	try {
		console.log('🚀 Running QStash setup via API...')
		await setupQStashJobs()

		return NextResponse.json({
			success: true,
			message: 'QStash setup completed successfully',
			timestamp: new Date().toISOString()
		})
	} catch (error) {
		console.error('Setup failed:', error)

		return NextResponse.json({
			error: 'Setup failed',
			details: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, {status: 500})
	}
}

// Also allow GET for easy testing (with same auth)
export async function GET(request: NextRequest) {
	const auth = request.headers.get('Authorization')
	const expectedAuth = `Bearer ${process.env.SETUP_SECRET || process.env.CRON_SECRET}`

	if (!auth || auth !== expectedAuth) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})
	}

	return NextResponse.json({
		message: 'QStash setup endpoint is ready',
		environment: process.env.VERCEL_URL ? 'production' : 'development',
		hasQStashToken: !!process.env.QSTASH_TOKEN,
		baseUrl: process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}`
			: process.env.BETTER_AUTH_URL || 'localhost'
	})
}
