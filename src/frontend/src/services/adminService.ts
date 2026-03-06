import { apiClient } from '@/services/apiClient'
import type { Role, Team } from '@/types/team'
import type { TaskItem } from '@/types/task'

export type PendingUser = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export type AdminUser = {
  id: string
  fullName: string
  email: string
  role: Role
  isApproved: boolean
  lastSeenAt?: string | null
  createdAt: string
}

export type AdminDashboard = {
  totalUsers: number
  totalTeams: number
  totalTasks: number
  completedTasksPercentage: number
  overdueTasksPercentage: number
}

export type TeamPerformance = {
  teamId: string
  teamName: string
  totalTasks: number
  completedTasks: number
  completionPercentage: number
  isTopPerformer: boolean
}

export type UserPerformance = {
  userId: string
  fullName: string
  email: string
  completedTasks: number
}

export const adminService = {
  getDashboard() {
    return apiClient.request<AdminDashboard>('/admin/dashboard')
  },
  getTeamPerformance() {
    return apiClient.request<TeamPerformance[]>('/admin/teams/performance')
  },
  getUserPerformance() {
    return apiClient.request<UserPerformance[]>('/admin/users/performance')
  },
  getUsers(status?: 'pending' | 'approved') {
    return apiClient.request<AdminUser[]>('/admin/users', {
      query: { status }
    })
  },
  updateUserRole(userId: string, role: Role) {
    return apiClient.request<{ message: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { role }
    })
  },
  getPendingUsers() {
    return apiClient.request<PendingUser[]>('/admin/users/pending')
  },
  approveUser(userId: string) {
    return apiClient.request<{ message: string }>(`/admin/users/${userId}/approve`, {
      method: 'POST'
    })
  },
  rejectUser(userId: string) {
    return apiClient.request<{ message: string }>(`/admin/users/${userId}/reject`, {
      method: 'POST'
    })
  },
  getTeams() {
    return apiClient.request<Team[]>('/admin/teams')
  },
  getTasks() {
    return apiClient.request<TaskItem[]>('/admin/tasks')
  },
  addUserToTeam(teamId: string, userId: string) {
    return apiClient.request<{ message: string }>(`/admin/teams/${teamId}/members/${userId}`, {
      method: 'POST'
    })
  }
}
