import { TaskPriority, TaskStatus, type TaskItem } from '@/types/task'

export const taskStatusLabel: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'Todo',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Review]: 'Review',
  [TaskStatus.Done]: 'Done'
}

export const taskPriorityLabel: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Low',
  [TaskPriority.Medium]: 'Medium',
  [TaskPriority.High]: 'High',
  [TaskPriority.Critical]: 'Critical'
}

export const taskPriorityColor: Record<TaskPriority, 'gray' | 'info' | 'warning' | 'primary'> = {
  [TaskPriority.Low]: 'gray',
  [TaskPriority.Medium]: 'info',
  [TaskPriority.High]: 'warning',
  [TaskPriority.Critical]: 'primary'
}

export type BoardColumnId = 'backlog' | 'todo' | 'inprogress' | 'done'

export const boardColumns: Array<{ id: BoardColumnId; title: string; status: TaskStatus }> = [
  { id: 'backlog', title: 'Backlog', status: TaskStatus.Review },
  { id: 'todo', title: 'Todo', status: TaskStatus.Todo },
  { id: 'inprogress', title: 'In Progress', status: TaskStatus.InProgress },
  { id: 'done', title: 'Done', status: TaskStatus.Done }
]

export const getBoardColumnId = (task: TaskItem): BoardColumnId => {
  if (task.status === TaskStatus.Review) {
    return 'backlog'
  }

  if (task.status === TaskStatus.Todo) {
    return 'todo'
  }

  if (task.status === TaskStatus.InProgress) {
    return 'inprogress'
  }

  if (task.status === TaskStatus.Done) {
    return 'done'
  }

  return 'todo'
}

export const columnToStatus = (columnId: BoardColumnId): TaskStatus => {
  switch (columnId) {
    case 'backlog':
      return TaskStatus.Review
    case 'todo':
      return TaskStatus.Todo
    case 'inprogress':
      return TaskStatus.InProgress
    case 'done':
      return TaskStatus.Done
    default:
      return TaskStatus.Todo
  }
}
