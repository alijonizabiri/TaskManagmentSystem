import { Menu, Bell, Search } from 'lucide-react'
import type { Team } from '@/types/team'
import { useAuthStore } from '@/store/authStore'

type TopBarProps = {
  onOpenSidebar: () => void
  teams: Team[]
  selectedTeamId: string | null
  onSelectTeam: (teamId: string) => void
}

export const TopBar = ({ onOpenSidebar, teams, selectedTeamId, onSelectTeam }: TopBarProps) => {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 hover:bg-gray-100 md:hidden" onClick={onOpenSidebar}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-gray-500"
            placeholder="Search tasks, members, teams"
          />
        </div>

        <select
          value={selectedTeamId ?? ''}
          onChange={(event) => onSelectTeam(event.target.value)}
          className="h-10 min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 text-sm"
        >
          {teams.length ? null : <option value="">No teams</option>}
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <button className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-1.5">
          <div className="h-8 w-8 rounded-full bg-indigo-100 text-center text-sm font-semibold leading-8 text-indigo-700">
            {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium leading-tight">{user?.fullName ?? 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email ?? '-'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
