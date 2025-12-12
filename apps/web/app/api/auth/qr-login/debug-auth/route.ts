import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'

/**
 * Debug endpoint to explore auth object structure
 */
export async function GET(request: NextRequest) {
	try {
		// Check what methods/properties are available on auth
		const authKeys = Object.keys(auth)
		const apiKeys = auth.api ? Object.keys(auth.api) : []
		
		// Check for internal adapter
		const hasOptions = 'options' in auth
		const hasContext = '$context' in auth
		const hasInfer = '$Infer' in auth
		
		// Explore $context more deeply
		const context = (auth as any).$context
		let contextKeys: string[] = []
		let contextInternalAdapterKeys: string[] = []
		let optionsKeys: string[] = []
		
		if (context) {
			contextKeys = Object.keys(context)
			if (context.internalAdapter) {
				contextInternalAdapterKeys = Object.keys(context.internalAdapter)
			}
		}
		
		// Check options structure
		const options = (auth as any).options
		if (options) {
			optionsKeys = Object.keys(options)
		}
		
		return NextResponse.json({
			authKeys,
			apiKeys,
			hasOptions,
			hasContext,
			hasInfer,
			contextKeys,
			contextInternalAdapterKeys,
			optionsKeys,
			// Check specific useful properties
			hasInternalAdapter: !!(context?.internalAdapter),
			hasDatabaseAdapter: !!(options?.adapter),
			hasSecret: !!options?.secret
		})
	} catch (error) {
		console.error('Debug error:', error)
		return NextResponse.json({
			error: String(error)
		}, {status: 500})
	}
}

