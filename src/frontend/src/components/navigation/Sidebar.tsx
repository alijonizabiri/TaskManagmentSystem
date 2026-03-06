import { NavLink } from 'react-router-dom'
import { ClipboardList, KanbanSquare, LogOut, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useTeamStore } from '@/store/teamStore'
import { Role } from '@/types/team'
import { useAuth } from '@/hooks/useAuth'

type SidebarProps = {
  mobileOpen: boolean
  onClose: () => void
}

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const logout = useAuthStore((state) => state.logout)
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId)
  const { role } = useAuth()

  const adminItems: NavItem[] = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: ShieldCheck },
    { label: 'Teams', to: '/teams', icon: Users, end: false },
    { label: 'User Management', to: '/admin/users', icon: Users }
  ]

  const workspaceItems: NavItem[] = [
    { label: 'Teams', to: '/teams', icon: Users, end: false },
    { label: 'Kanban Board', to: '/kanban', icon: KanbanSquare },
    { label: 'Invite Members', to: selectedTeamId ? `/teams/${selectedTeamId}/invite` : '/teams', icon: ClipboardList },
    { label: 'Settings', to: '/settings', icon: Settings }
  ]

  const navItems = role === Role.Admin ? adminItems : workspaceItems

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-indigo-100 bg-white px-4 pb-6 pt-5 transition-transform md:translate-x-0',
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
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end ?? true}
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

        <div className="mt-auto pt-6">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen ? <div className="fixed inset-0 z-30 bg-gray-900/30 md:hidden" onClick={onClose} /> : null}
    </>
  )
}
