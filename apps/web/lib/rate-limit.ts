import {Redis} from '@upstash/redis'
import {NextRequest} from 'next/server'

// Initialize Redis client
const redis = new Redis({ // eslint-disable-next-line turbo/no-undeclared-env-vars
	url: process.env.UPSTASH_REDIS_REST_URL || '', // eslint-disable-next-line turbo/no-undeclared-env-vars
	token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

export interface RateLimitConfig {
  limit: number
  window: number // in seconds
}

export const RATE_LIMIT_CONFIGS = {
	standard: {limit: 100, window: 60}, // 100 requests per minute
	login: {limit: 2, window: 60}, // 10 requests per minute
	passwordReset: {limit: 2, window: 60} // 2 requests per minute
} as const

const getIpAddress = (request: NextRequest): string | undefined => { // eslint-disable-next-line turbo/no-undeclared-env-vars
	if (process.env.VERCEL_ENV) {
		// We're on Vercel, use the real function
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const {ipAddress} = require('@vercel/functions')
		return ipAddress(request)
	} else {
		// We're in local development, return a mock IP or extract from headers
		return request.headers.get('x-forwarded-for')?.split(',')[0]
      || request.headers.get('x-real-ip')
      || '127.0.0.1'
	}
}

export const rateLimit = async (
	request: NextRequest,
	config: RateLimitConfig,
	identifier: string
) => {
	const ip = getIpAddress(request) || 'anonymous'

	const key = `rate-limit:${identifier}:${ip}`

	try {
		const [response] = await redis
			.multi()
			.incr(key)
			.expire(key, config.window)
			.exec()

		const currentRequests = response as number

		// Return rate limit info
		return {
			success: currentRequests <= config.limit,
			limit: config.limit,
			remaining: Math.max(0, config.limit - currentRequests),
			reset: Date.now() + config.window * 1000
		}
	} catch (error) {
		// Fail open - allow request in case of Redis error
		if (error instanceof Error) {
			process.stdout.write(`Error: ${error.message}\n`)
		}

		return {
			success: true,
			limit: config.limit,
			remaining: 0,
			reset: Date.now() + config.window * 1000
		}
	}
}

// Helper to generate standard headers for rate limiting
export const getRateLimitHeaders = (rateLimitResult: Awaited<ReturnType<typeof rateLimit>>) => ({
	'X-RateLimit-Limit': rateLimitResult.limit.toString(),
	'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
	'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString()
})
