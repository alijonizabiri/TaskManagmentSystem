import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { RoleRoute } from '@/router/RoleRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoginPage } from '@/pages/LoginPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { SystemStatisticsPage } from '@/pages/SystemStatisticsPage'
import { TeamDashboardPage } from '@/pages/TeamDashboardPage'
import { KanbanBoardPage } from '@/pages/KanbanBoardPage'
import { TaskDetailsPage } from '@/pages/TaskDetailsPage'
import { InviteMembersPage } from '@/pages/InviteMembersPage'
import { ActivitiesPage } from '@/pages/ActivitiesPage'
import { MyTasksPage } from '@/pages/MyTasksPage'
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
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/team" replace />
}

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />

          <Route element={<DashboardLayout />}>
            <Route path="/team" element={<TeamDashboardPage />} />
            <Route path="/kanban" element={<KanbanBoardPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />

            <Route element={<RoleRoute allowedRoles={[Role.User]} />}>
              <Route path="/tasks/my" element={<MyTasksPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={[Role.Admin]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/stats" element={<SystemStatisticsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={[Role.Admin, Role.TeamLead]} />}>
              <Route path="/teams/:teamId/invite" element={<InviteMembersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
