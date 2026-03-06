import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/team'
import { hasRequiredRole } from '@/utils/rbac'

type RoleRouteProps = {
  allowedRoles: Role[]
}

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { role } = useAuth()

  if (!hasRequiredRole(role, allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}