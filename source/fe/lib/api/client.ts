import type { ApiResponse } from '@/shared/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const isSuccess = (code: number) => code >= 200 && code < 300
export const isUnauthorized = (code: number) => code === 401
export const isNotFound = (code: number) => code === 404
export const isValidationError = (code: number) => code === 400

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  return res.json() as Promise<ApiResponse<T>>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
