import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { BoardColumnId } from '@/utils/task'
import type { TaskItem } from '@/types/task'

type KanbanColumnProps = {
  id: BoardColumnId
  title: string
  tasks: TaskItem[]
  children: (task: TaskItem) => React.ReactNode
}

export const KanbanColumn = ({ id, title, tasks, children }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[420px] rounded-2xl border ${isOver ? 'border-indigo-300 bg-indigo-50/60' : 'border-gray-200 bg-white'} p-3 transition`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id}>{children(task)}</div>
          ))}
        </div>
      </SortableContext>
    </section>
  )
}
