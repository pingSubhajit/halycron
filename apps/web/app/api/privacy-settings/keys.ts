export const privacySettingsQueryKeys = {
	all: () => ['privacy-settings'] as const,
	settings: () => [...privacySettingsQueryKeys.all()] as const
} 