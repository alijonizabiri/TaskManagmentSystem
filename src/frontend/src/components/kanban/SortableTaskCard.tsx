import { GripVertical } from 'lucide-react'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import type { TaskItem } from '@/types/task'
import { TaskCard } from '@/components/tasks/TaskCard'

type SortableTaskCardProps = {
  task: TaskItem
  onOpenTask: (taskId: string) => void
}

export const SortableTaskCard = ({ task, onOpenTask }: SortableTaskCardProps) => {
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
      <TaskCard task={task} onOpen={onOpenTask} />
      <span className="pointer-events-none absolute right-2 top-2 rounded-md p-1 text-gray-400">
        <GripVertical className="h-4 w-4" />
      </span>
    </div>
  )
}
