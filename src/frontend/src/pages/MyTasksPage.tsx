import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { teamService } from '@/services/teamService'
import { taskService } from '@/services/taskService'
import { useEnsureSelectedTeam } from '@/hooks/useEnsureSelectedTeam'
import { formatDateTime } from '@/utils/format'
import { taskPriorityLabel, taskStatusLabel } from '@/utils/task'

export const MyTasksPage = () => {
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getMyTeams
  })

  const { selectedTeamId } = useEnsureSelectedTeam(teamsQuery.data)

  const myTasksQuery = useQuery({
    queryKey: ['my-tasks', selectedTeamId],
    queryFn: () => taskService.getMyTasks(selectedTeamId ?? undefined)
  })

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Personal Workspace</p>
        <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
      </header>

      <Card title="Assigned and visible tasks" subtitle="Tasks from your teams">
        {myTasksQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading tasks...</p>
        ) : myTasksQuery.data?.length ? (
          <div className="space-y-3">
            {myTasksQuery.data.map((task) => (
              <article key={task.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <span className="text-xs font-medium text-gray-600">{taskStatusLabel[task.status]}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">Priority: {taskPriorityLabel[task.priority]}</p>
                <p className="text-xs text-gray-500">Deadline: {formatDateTime(task.deadline)}</p>
                <Link to={`/tasks/${task.id}`} className="mt-2 inline-flex text-xs font-semibold text-indigo-600 hover:underline">
                  Open details
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tasks found.</p>
        )}
      </Card>
    </div>
  )
}