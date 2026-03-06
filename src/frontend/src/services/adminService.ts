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

export const adminService = {
  getUsers() {
    return apiClient.request<AdminUser[]>('/admin/users')
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
  }
}