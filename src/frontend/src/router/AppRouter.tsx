import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { RoleRoute } from '@/router/RoleRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoginPage } from '@/pages/LoginPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { TeamsPage } from '@/pages/TeamsPage'
import { TeamWorkspacePage } from '@/pages/TeamWorkspacePage'
import { TeamKanbanRedirectPage } from '@/pages/TeamKanbanRedirectPage'
import { InviteMembersPage } from '@/pages/InviteMembersPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TaskDetailsPage } from '@/pages/TaskDetailsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types/team'

const RootRedirect = () => {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

const DashboardRedirect = () => {
  const { role } = useAuth()

  if (role === Role.Admin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Navigate to="/teams" replace />
}

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/team" element={<Navigate to="/teams" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/activities" element={<Navigate to="/teams" replace />} />
          <Route path="/tasks/my" element={<Navigate to="/teams" replace />} />

          <Route element={<DashboardLayout />}>
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamWorkspacePage />} />
            <Route path="/teams/:teamId/invite" element={<InviteMembersPage />} />
            <Route path="/kanban" element={<TeamKanbanRedirectPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />

            <Route element={<RoleRoute allowedRoles={[Role.Admin]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
