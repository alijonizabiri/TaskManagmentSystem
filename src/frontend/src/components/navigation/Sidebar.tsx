import { NavLink } from 'react-router-dom'
import {
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Users,
  X,
  KanbanSquare,
  LogOut
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useTeamStore } from '@/store/teamStore'
import { Role } from '@/types/team'
import { useAuth } from '@/hooks/useAuth'
import { hasRequiredRole } from '@/utils/rbac'

type SidebarProps = {
  mobileOpen: boolean
  onClose: () => void
}

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles?: Role[]
}

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const logout = useAuthStore((state) => state.logout)
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId)
  const { role } = useAuth()

  const navItems: NavItem[] = [
    {
      label: role === Role.User ? 'My Teams' : 'Team Management',
      to: '/team',
      icon: LayoutDashboard,
      allowedRoles: [Role.Admin, Role.TeamLead, Role.User]
    },
    { label: 'Kanban Board', to: '/kanban', icon: KanbanSquare, allowedRoles: [Role.Admin, Role.TeamLead, Role.User] },
    { label: 'My Tasks', to: '/tasks/my', icon: ClipboardList, allowedRoles: [Role.User] },
    { label: 'Admin Dashboard', to: '/admin', icon: ShieldCheck, allowedRoles: [Role.Admin] },
    { label: 'User Management', to: '/admin/users', icon: Users, allowedRoles: [Role.Admin] },
    { label: 'System Statistics', to: '/admin/stats', icon: LayoutDashboard, allowedRoles: [Role.Admin] },
    {
      label: 'Invite Members',
      to: selectedTeamId ? `/teams/${selectedTeamId}/invite` : '/team',
      icon: Users,
      allowedRoles: [Role.Admin, Role.TeamLead]
    }
  ]

  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles ? hasRequiredRole(role, item.allowedRoles) : true
  )

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-indigo-100 bg-white px-4 pb-6 pt-5 transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Task Management</p>
            <p className="text-xl font-semibold text-gray-900">Workspace</p>
          </div>
          <button className="rounded-md p-1 text-gray-600 hover:bg-gray-100 md:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1.5">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-indigo-700">
            <ClipboardList className="h-4 w-4" />
            <p className="text-sm font-semibold">Sprint Focus</p>
          </div>
          <p className="text-xs text-indigo-700/80">Prioritize high-impact tasks and keep backlog clean daily.</p>
        </div>

        <button
          onClick={logout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      {mobileOpen ? <div className="fixed inset-0 z-30 bg-gray-900/30 md:hidden" onClick={onClose} /> : null}
    </>
  )
}
