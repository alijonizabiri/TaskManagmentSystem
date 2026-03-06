import { apiClient } from '@/services/apiClient'
import type {
  AssignTaskRequest,
  CreateTaskRequest,
  TaskItem,
  UpdateTaskStatusRequest
} from '@/types/task'

export const taskService = {
  getTasks(teamId?: string) {
    return apiClient.request<TaskItem[]>('/tasks', {
      query: { teamId }
    })
  },
  getMyTasks(teamId?: string) {
    return apiClient.request<TaskItem[]>('/tasks/my', {
      query: { teamId }
    })
  },
  getTask(taskId: string) {
    return apiClient.request<TaskItem>(`/tasks/${taskId}`)
  },
  getActivities(teamId: string, createdByUserId?: string) {
    return apiClient.request<TaskItem[]>('/tasks/activities', {
      query: { teamId, createdByUserId }
    })
  },
  createTask(payload: CreateTaskRequest) {
    return apiClient.request<TaskItem>('/tasks', {
      method: 'POST',
      body: payload
    })
  },
  updateTaskStatus(taskId: string, payload: UpdateTaskStatusRequest) {
    return apiClient.request<{ message: string }>(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: payload
    })
  },
  assignTask(taskId: string, payload: AssignTaskRequest) {
    return apiClient.request<{ message: string }>(`/tasks/${taskId}/assign`, {
      method: 'PATCH',
      body: payload
    })
  }
}
