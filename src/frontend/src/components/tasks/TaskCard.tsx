import { CalendarDays, UserCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { TaskItem } from '@/types/task'
import { formatDate, timeAgo } from '@/utils/format'
import { taskPriorityColor, taskPriorityLabel } from '@/utils/task'

type TaskCardProps = {
  task: TaskItem
  onOpen: (taskId: string) => void
}

export const TaskCard = ({ task, onOpen }: TaskCardProps) => {
  return (
    <button
      onClick={() => onOpen(task.id)}
      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-card"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge color={taskPriorityColor[task.priority]}>{taskPriorityLabel[task.priority]}</Badge>
        <span className="text-xs text-gray-500">{timeAgo(task.createdAt)}</span>
      </div>

      <h4 className="line-clamp-2 text-sm font-semibold text-gray-900">{task.title}</h4>
      {task.description ? <p className="mt-1 line-clamp-2 text-xs text-gray-500">{task.description}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <UserCircle2 className="h-3.5 w-3.5" />
          {task.assigneeName ?? 'Unassigned'}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(task.deadline)}
        </span>
      </div>
    </button>
  )
}
