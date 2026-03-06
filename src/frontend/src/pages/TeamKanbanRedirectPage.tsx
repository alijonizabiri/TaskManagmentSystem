import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { teamService } from '@/services/teamService'
import { useEnsureSelectedTeam } from '@/hooks/useEnsureSelectedTeam'

export const TeamKanbanRedirectPage = () => {
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams
  })

  const { selectedTeamId } = useEnsureSelectedTeam(teamsQuery.data)

  if (teamsQuery.isLoading) {
    return <p className="text-sm text-gray-500">Loading teams...</p>
  }

  if (!selectedTeamId) {
    return <Navigate to="/teams" replace />
  }

  return <Navigate to={`/teams/${selectedTeamId}`} replace />
}