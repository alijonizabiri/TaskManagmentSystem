import { useAuthStore } from '@/store/authStore'
import { ApiError, type ApiErrorPayload } from '@/types/api'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  skipAuthRedirect?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return `${url.pathname}${url.search}`
}

export const apiClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = useAuthStore.getState().token
    const headers = new Headers(options.headers)

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    if (options.body !== undefined && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(buildUrl(path, options.query), {
      ...options,
      headers,
      body:
        options.body === undefined
          ? undefined
          : options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body)
    })

    if (!response.ok) {
      let message = 'Request failed.'

      try {
        const payload = (await response.json()) as ApiErrorPayload
        message = payload.message ?? message
      } catch {
        const text = await response.text()
        if (text) {
          message = text
        }
      }

      if (response.status === 401 && !options.skipAuthRedirect && !path.startsWith('/auth/')) {
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.replace('/login')
        }
      }

      throw new ApiError(message, response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }
}
