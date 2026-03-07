import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import type { TaskItem } from '@/types/task'
import { TaskCard } from '@/components/tasks/TaskCard'
import type { TeamMember } from '@/types/team'
import type { UpdateTaskRequest } from '@/types/task'

type SortableTaskCardProps = {
  task: TaskItem
  onOpenTask: (taskId: string) => void
  onQuickUpdate?: (taskId: string, payload: UpdateTaskRequest) => void
  members?: TeamMember[]
  canManageFields?: boolean
}

export const SortableTaskCard = ({
  task,
  onOpenTask,
  onQuickUpdate,
  members = [],
  canManageFields = false
}: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      taskId: task.id
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isDragging ? 'z-20 opacity-70' : ''}`}
      style={{ touchAction: 'none', transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onOpen={onOpenTask}
        onQuickUpdate={onQuickUpdate}
        members={members}
        canManageFields={canManageFields}
      />
    </div>
  )
}
