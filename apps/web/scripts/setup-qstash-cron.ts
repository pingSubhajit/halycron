/**
 * Setup script to initialize QStash CRON jobs
 * Run this after deployment to set up the cleanup schedule
 */

import {scheduleCleanupJob} from '@/lib/qstash-client'

const setupQStashJobs = async () => {
	console.log('Setting up QStash CRON jobs...')

	// Check if we're in a production environment
	const baseUrl = process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL

	if (!baseUrl || baseUrl.includes('localhost')) {
		console.log('⚠️  Skipping QStash setup: This script should only be run in production')
		console.log('   QStash cannot schedule jobs to localhost URLs')
		console.log('   Deploy to Vercel first, then run this script')
		return
	}

	// Check required environment variables
	if (!process.env.QSTASH_TOKEN) {
		console.error('❌ QSTASH_TOKEN environment variable is required')
		process.exit(1)
	}

	console.log(`📡 Setting up CRON jobs for: ${baseUrl}`)

	try {
		await scheduleCleanupJob()
		console.log('✅ QStash CRON jobs setup completed')
		console.log('   Check the QStash console to verify the schedule: https://console.upstash.com/')
	} catch (error) {
		console.error('❌ Failed to setup QStash CRON jobs:', error)
		console.error('   Make sure:')
		console.error('   1. QSTASH_TOKEN is set correctly')
		console.error('   2. You are running this in production (not localhost)')
		console.error('   3. The deployment is accessible via HTTPS')
		process.exit(1)
	}
}

export {setupQStashJobs}
