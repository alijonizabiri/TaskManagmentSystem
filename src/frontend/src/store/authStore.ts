import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, CurrentUser } from '@/types/auth'
import { Role } from '@/types/team'

type AuthState = {
  token: string | null
  user: CurrentUser | null
  setAuth: (payload: AuthResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (payload) =>
        set({
          token: payload.token,
          user: {
            fullName: payload.fullName,
            email: payload.email,
            role: payload.role ?? Role.User
          }
        }),
      logout: () => set({ token: null, user: null })
    }),
    {
      name: 'tms-auth'
    }
  )
)
