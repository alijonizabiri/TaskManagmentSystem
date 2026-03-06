import { useEffect } from 'react'
import { useTeamStore } from '@/store/teamStore'
import type { Team } from '@/types/team'

export const useEnsureSelectedTeam = (teams: Team[] | undefined) => {
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId)
  const setSelectedTeamId = useTeamStore((state) => state.setSelectedTeamId)

  useEffect(() => {
    if (!teams?.length) {
      return
    }

    const exists = teams.some((team) => team.id === selectedTeamId)
    if (!selectedTeamId || !exists) {
      setSelectedTeamId(teams[0].id)
    }
  }, [selectedTeamId, setSelectedTeamId, teams])

  return { selectedTeamId, setSelectedTeamId }
}
