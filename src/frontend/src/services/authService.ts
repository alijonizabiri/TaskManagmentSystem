import { apiClient } from '@/services/apiClient'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'

export const authService = {
  login(payload: LoginRequest) {
    return apiClient.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload
    })
  },
  register(payload: RegisterRequest) {
    return apiClient.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: payload
    })
  }
}
