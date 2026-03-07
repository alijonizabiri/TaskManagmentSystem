export enum TaskStatus {
  Todo = 0,
  InProgress = 1,
  Review = 2,
  Done = 3
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export type TaskItem = {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  deadline?: string | null
  assigneeName?: string | null
  assigneeId?: string | null
  teamId: string
  createdByName: string
  createdAt: string
  attachments?: TaskAttachment[]
}

export type CreateTaskRequest = {
  title: string
  description?: string
  priority: TaskPriority
  deadline?: string
  assigneeId?: string
  teamId: string
}

export type UpdateTaskStatusRequest = {
  status: TaskStatus
}

export type AssignTaskRequest = {
  assigneeId: string
}

export type UpdateTaskRequest = {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  deadline?: string
  clearDeadline?: boolean
  assigneeId?: string
  clearAssignee?: boolean
}

export type TaskComment = {
  id: string
  author: string
  content: string
  createdAt: string
}

export type TaskAttachment = {
  id: string
  fileName: string
  contentType?: string
  sizeBytes?: number
  size?: string
  url?: string
  uploadedByName?: string
  createdAt?: string
}
