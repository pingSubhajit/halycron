type RequestOptions = {
	method?: string
	headers?: Record<string, string>
	body?: any
	cookie?: string
	params?: Record<string, string | number | boolean | undefined | null>
	cache?: RequestCache
	next?: NextFetchRequestConfig
}

type ApiError = {
	error: string
}

const buildUrlWithParams = (
	url: string,
	params?: RequestOptions['params']
): string => {
	if (!params) return url
	const filteredParams = Object.fromEntries(
		Object.entries(params).filter(
			([, value]) => value !== undefined && value !== null
		)
	)
	if (Object.keys(filteredParams).length === 0) return url
	const queryString = new URLSearchParams(
		filteredParams as Record<string, string>
	).toString()
	return `${url}?${queryString}`
}

const fetchApi = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
	const {
		method = 'GET',
		headers = {},
		body,
		cookie,
		params,
		cache = 'no-store',
		next
	} = options

	const fullUrl = buildUrlWithParams(`${url}`, params)

	const response = await fetch(fullUrl, {
		method,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...headers
		},
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include',
		cache,
		next
	})

	if (!response.ok) {
		const error = ((await response.json()) || response.statusText) as ApiError
		if (typeof window !== 'undefined') {
			// error handing
		}

		throw new Error(error.error)
	}

	if (response.status === 204) {
		return {} as T
	}

	return response.json()
}

export const api = {
	get: async <T>(url: string, options?: RequestOptions): Promise<T> => {
		return fetchApi<T>(url, {...options, method: 'GET'})
	},
	post: async <T>(url: string, body?: any, options?: RequestOptions): Promise<T> => {
		return fetchApi<T>(url, {...options, method: 'POST', body})
	},
	put: async <T>(url: string, body?: any, options?: RequestOptions): Promise<T> => {
		return fetchApi<T>(url, {...options, method: 'PUT', body})
	},
	patch: async <T>(url: string, body?: any, options?: RequestOptions): Promise<T> => {
		return fetchApi<T>(url, {...options, method: 'PATCH', body})
	},
	delete: async <T>(url: string, options?: RequestOptions): Promise<T> => {
		return fetchApi<T>(url, {...options, method: 'DELETE'})
	}
}
