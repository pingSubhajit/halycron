/**
 * Post-deployment script for production setup
 * This should be run AFTER successful deployment to production
 */

import {setupQStashJobs} from './setup-qstash-cron'

async function postDeploy() {
	console.log('🚀 Running post-deployment setup...')

	// Verify we're in the right environment
	if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_URL) {
		console.log('⚠️  This script should be run in production environment')
		console.log('   Set NODE_ENV=production or deploy to Vercel first')
		return
	}

	try {
		await setupQStashJobs()
		console.log('🎉 Post-deployment setup completed successfully!')
	} catch (error) {
		console.error('❌ Post-deployment setup failed:', error)
		process.exit(1)
	}
}

if (require.main === module) {
	postDeploy()
}

export {postDeploy}
