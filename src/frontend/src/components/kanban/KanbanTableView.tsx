import type { TaskItem } from '@/types/task'
import { formatDate } from '@/utils/format'
import { boardColumns, getBoardColumnId, taskPriorityLabel, type BoardColumnId } from '@/utils/task'

type KanbanTableViewProps = {
  tasks: TaskItem[]
  onOpenTask: (taskId: string) => void
  onMoveTask: (task: TaskItem, targetColumn: BoardColumnId) => void
}

export const KanbanTableView = ({ tasks, onOpenTask, onMoveTask }: KanbanTableViewProps) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr className="text-xs uppercase tracking-[0.1em] text-gray-500">
            <th className="px-3 py-3">Task</th>
            <th className="px-3 py-3">Priority</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Assignee</th>
            <th className="px-3 py-3">Deadline</th>
            <th className="px-3 py-3">Created By</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const currentColumn = getBoardColumnId(task)
            return (
              <tr key={task.id} className="border-t border-gray-200">
                <td className="px-3 py-3">
                  <button
                    className="text-left font-semibold text-gray-900 hover:text-indigo-600"
                    onClick={() => onOpenTask(task.id)}
                  >
                    {task.title}
                  </button>
                  {task.description ? <p className="mt-1 max-w-md truncate text-xs text-gray-500">{task.description}</p> : null}
                </td>
                <td className="px-3 py-3 text-gray-600">{taskPriorityLabel[task.priority]}</td>
                <td className="px-3 py-3">
                  <select
                    value={currentColumn}
                    onChange={(event) => onMoveTask(task, event.target.value as BoardColumnId)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs"
                  >
                    {boardColumns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3 text-gray-600">{task.assigneeName ?? 'Unassigned'}</td>
                <td className="px-3 py-3 text-gray-600">{formatDate(task.deadline)}</td>
                <td className="px-3 py-3 text-gray-600">{task.createdByName}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
