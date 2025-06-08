export interface PrivacySettingsResponse {
	stripLocationData: boolean
	anonymizeTimestamps: boolean
	disableAnalytics: boolean
	minimalServerLogs: boolean
}

export interface UpdatePrivacySettingRequest {
	settingId: string
	enabled: boolean
} 