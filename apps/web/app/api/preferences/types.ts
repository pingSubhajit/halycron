export interface UserPreferencesResponse {
	inactivityAutoLogoutEnabled: boolean
}

export interface UpdateUserPreferenceRequest {
	preferenceId: string
	enabled: boolean
}


