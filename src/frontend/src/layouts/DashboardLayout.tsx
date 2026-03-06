import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TopBar } from '@/components/navigation/TopBar'
import { teamService } from '@/services/teamService'
import { useEnsureSelectedTeam } from '@/hooks/useEnsureSelectedTeam'

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams
  })

  const { selectedTeamId, setSelectedTeamId } = useEnsureSelectedTeam(teams)

  return (
    <div className="h-screen overflow-hidden bg-brand-muted/70">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex h-full flex-1 flex-col overflow-hidden md:pl-72">
        <TopBar
          onOpenSidebar={() => setMobileOpen(true)}
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={setSelectedTeamId}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
