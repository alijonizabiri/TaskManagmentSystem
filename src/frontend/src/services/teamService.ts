import { apiClient } from '@/services/apiClient'
import type { Team, TeamMember, CreateTeamRequest, InviteMemberRequest, InviteMemberResponse } from '@/types/team'

export const teamService = {
  getTeams() {
    return apiClient.request<Team[]>('/teams')
  },
  getMyTeams() {
    return apiClient.request<Team[]>('/teams/my')
  },
  getTeamMembers(teamId: string) {
    return apiClient.request<TeamMember[]>(`/teams/${teamId}/members`)
  },
  createTeam(payload: CreateTeamRequest) {
    return apiClient.request<Team>('/teams', {
      method: 'POST',
      body: payload
    })
  },
  inviteMember(teamId: string, payload: InviteMemberRequest) {
    return apiClient.request<InviteMemberResponse>(`/teams/${teamId}/invite`, {
      method: 'POST',
      body: payload
    })
  }
}
