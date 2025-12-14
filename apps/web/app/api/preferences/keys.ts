export const userPreferencesQueryKeys = {
	all: () => ['user-preferences'] as const,
	preferences: () => [...userPreferencesQueryKeys.all()] as const
}


