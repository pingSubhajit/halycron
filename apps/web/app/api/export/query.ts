import {useMutation, useQuery, useQueryClient, UseQueryOptions} from '@tanstack/react-query'
import {api} from '@/lib/data/api-client'
import {ExportData} from './route'

export const exportQueryKeys = {
	all: ['export'] as const,
	status: (exportId: string) => [...exportQueryKeys.all, 'status', exportId] as const,
	current: () => [...exportQueryKeys.all, 'current'] as const
}

export const useCreateExport = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (): Promise<ExportData> => {
			return api.post<ExportData>('/api/export')
		},
		onSuccess: (data) => {
			// Immediately start polling for status updates
			queryClient.setQueryData(exportQueryKeys.status(data.id), data)
			// Update the current user export query
			queryClient.setQueryData(exportQueryKeys.current(), data)
		}
	})
}

export const useExportStatus = (
	exportId: string | undefined,
	options?: Omit<UseQueryOptions<ExportData, Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery({
		queryKey: exportQueryKeys.status(exportId || ''),
		queryFn: async (): Promise<ExportData> => {
			if (!exportId) throw new Error('Export ID is required')
			return api.get<ExportData>('/api/export', {
				params: {exportId}
			})
		},
		enabled: !!exportId,
		refetchInterval: (query) => {
			// Poll every 2 seconds while processing, stop when ready/failed
			const status = query.state.data?.status
			return status === 'processing' || status === 'pending' ? 2000 : false
		},
		...options
	})
}

export const useCurrentUserExport = (
	options?: Omit<UseQueryOptions<ExportData | null, Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery({
		queryKey: exportQueryKeys.current(),
		queryFn: async (): Promise<ExportData | null> => {
			return api.get<ExportData | null>('/api/export')
		},
		refetchInterval: (query) => {
			// Poll every 2 seconds while processing, stop when ready/failed/null
			const status = query.state.data?.status
			return status === 'processing' || status === 'pending' ? 2000 : false
		},
		...options
	})
}
 