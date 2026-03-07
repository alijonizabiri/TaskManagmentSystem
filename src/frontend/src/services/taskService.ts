import { apiClient } from '@/services/apiClient'
import type {
  AssignTaskRequest,
  CreateTaskRequest,
  TaskItem,
  TaskAttachment,
  UpdateTaskRequest,
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
  updateTask(taskId: string, payload: UpdateTaskRequest) {
    return apiClient.request<{ message: string }>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: payload
    })
  },
  assignTask(taskId: string, payload: AssignTaskRequest) {
    return apiClient.request<{ message: string }>(`/tasks/${taskId}/assign`, {
      method: 'PATCH',
      body: payload
    })
  },
  getAttachments(taskId: string) {
    return apiClient.request<TaskAttachment[]>(`/tasks/${taskId}/attachments`)
  },
  uploadAttachment(taskId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.request<TaskAttachment>(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData
    })
  },
  deleteAttachment(taskId: string, attachmentId: string) {
    return apiClient.request<{ message: string }>(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    })
  }
}
