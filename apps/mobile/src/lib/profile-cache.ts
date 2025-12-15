import AsyncStorage from '@react-native-async-storage/async-storage'

// Storage keys for profile cache
const PROFILE_CACHE_KEY = 'halycron_profile_cache'

export interface CachedProfileData {
	firstName: string | null
	profilePictureUrl: string | null
	profilePictureKey: string | null // S3 key for detecting changes
	cachedAt: number
}

/**
 * Get cached profile data from device storage
 */
export const getCachedProfile = async (): Promise<CachedProfileData | null> => {
	try {
		const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY)
		if (!cached) return null
		return JSON.parse(cached) as CachedProfileData
	} catch (error) {
		console.error('Error reading profile cache:', error)
		return null
	}
}

/**
 * Save profile data to device storage cache
 */
export const setCachedProfile = async (data: CachedProfileData): Promise<void> => {
	try {
		await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data))
	} catch (error) {
		console.error('Error saving profile cache:', error)
	}
}

/**
 * Clear profile cache from device storage
 */
export const clearProfileCache = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(PROFILE_CACHE_KEY)
	} catch (error) {
		console.error('Error clearing profile cache:', error)
	}
}

/**
 * Extract first name from full name
 */
export const extractFirstName = (fullName: string | null | undefined): string | null => {
	if (!fullName) return null
	return fullName.split(' ')[0] || null
}

