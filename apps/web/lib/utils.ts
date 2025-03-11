/**
 * Get the base URL for the application
 * Uses the same base URL as the auth service
 */
export function getBaseUrl() {
    if (typeof window !== 'undefined') {
        // browser should use relative path
        return '';
    }

    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
} 