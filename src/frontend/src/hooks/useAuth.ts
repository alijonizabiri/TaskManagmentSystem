import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/types/team'
import { canAccessAdminPages, canCreateTasks, canInviteUsers } from '@/utils/rbac'

export const useAuth = () => {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const role = user?.role ?? Role.User

  return useMemo(
    () => ({
      token,
      user,
      role,
      isAdmin: canAccessAdminPages(role),
      canInviteUsers: canInviteUsers(role),
      canCreateTasks: canCreateTasks(role),
      logout,
      isAuthenticated: Boolean(token)
    }),
    [token, user, role, logout]
  )
}
