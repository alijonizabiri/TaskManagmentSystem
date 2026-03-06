import type { Role } from '@/types/team'

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export type AuthResponse = {
  token: string
  fullName: string
  email: string
  role: Role
}

export type CurrentUser = {
  fullName: string
  email: string
  role: Role
}
