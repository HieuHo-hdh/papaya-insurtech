import { apiClient } from './client'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string }>('/auth/login', { email, password }),

  logout: () =>
    apiClient.post<null>('/auth/logout', {}),
}

export function saveToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function hasToken(): boolean {
  return !!localStorage.getItem('token')
}
