import { apiClient } from '@/services/apiClient'
import type {
  Team,
  TeamDetail,
  TeamMember,
  TeamStats,
  CreateTeamRequest,
  UpdateTeamRequest,
  InviteMemberRequest,
  InviteMemberResponse
} from '@/types/team'
import type { TaskItem } from '@/types/task'

export const teamService = {
  getTeams() {
    return apiClient.request<Team[]>('/teams')
  },
  getMyTeams() {
    return apiClient.request<Team[]>('/teams/my')
  },
  getTeam(teamId: string) {
    return apiClient.request<TeamDetail>(`/teams/${teamId}`)
  },
  getTeamStats(teamId: string) {
    return apiClient.request<TeamStats>(`/teams/${teamId}/stats`)
  },
  getTeamTasks(teamId: string) {
    return apiClient.request<TaskItem[]>(`/teams/${teamId}/tasks`)
  },
  getTeamActivities(teamId: string, createdByUserId?: string) {
    return apiClient.request<TaskItem[]>(`/teams/${teamId}/activities`, {
      query: { createdByUserId }
    })
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
  updateTeam(teamId: string, payload: UpdateTeamRequest) {
    return apiClient.request<Team>(`/teams/${teamId}`, {
      method: 'PATCH',
      body: payload
    })
  },
  deleteTeam(teamId: string) {
    return apiClient.request<{ message: string }>(`/teams/${teamId}`, {
      method: 'DELETE'
    })
  },
  inviteMember(teamId: string, payload: InviteMemberRequest) {
    return apiClient.request<InviteMemberResponse>(`/teams/${teamId}/invite`, {
      method: 'POST',
      body: payload
    })
  }
}
