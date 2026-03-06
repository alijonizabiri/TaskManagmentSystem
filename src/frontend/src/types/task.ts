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

export type TaskComment = {
  id: string
  author: string
  content: string
  createdAt: string
}

export type TaskAttachment = {
  id: string
  fileName: string
  size: string
}
