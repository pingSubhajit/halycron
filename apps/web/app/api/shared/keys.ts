// Query keys for shared links
export const sharedQueryKeys = {
	all: ['shared'] as const,
	lists: () => [...sharedQueryKeys.all, 'list'] as const,
	list: (filters: string) => [...sharedQueryKeys.lists(), {filters}] as const,
	details: () => [...sharedQueryKeys.all, 'detail'] as const,
	detail: (token: string) => [...sharedQueryKeys.details(), token] as const
}
