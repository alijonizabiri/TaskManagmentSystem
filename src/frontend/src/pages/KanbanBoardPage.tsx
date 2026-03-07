import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Plus, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { KanbanTableView } from '@/components/kanban/KanbanTableView'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { teamService } from '@/services/teamService'
import { taskService } from '@/services/taskService'
import { useEnsureSelectedTeam } from '@/hooks/useEnsureSelectedTeam'
import { useAuth } from '@/hooks/useAuth'
import type { TaskItem, UpdateTaskRequest } from '@/types/task'
import { columnToStatus, type BoardColumnId } from '@/utils/task'

export const KanbanBoardPage = () => {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const { canCreateTasks } = useAuth()

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams
  })

  const { selectedTeamId } = useEnsureSelectedTeam(teamsQuery.data)

  const tasksQuery = useQuery({
    queryKey: ['tasks', selectedTeamId],
    queryFn: () => taskService.getTasks(selectedTeamId ?? undefined),
    enabled: Boolean(selectedTeamId)
  })

  const membersQuery = useQuery({
    queryKey: ['team-members', selectedTeamId],
    queryFn: () => teamService.getTeamMembers(selectedTeamId!),
    enabled: Boolean(selectedTeamId)
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: number }) =>
      taskService.updateTaskStatus(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', selectedTeamId] })
      const previousTasks = queryClient.getQueryData<TaskItem[]>(['tasks', selectedTeamId])

      queryClient.setQueryData<TaskItem[]>(['tasks', selectedTeamId], (current) =>
        (current ?? []).map((task) => (task.id === taskId ? { ...task, status } : task))
      )

      return { previousTasks }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', selectedTeamId], context.previousTasks)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks', selectedTeamId] })
    }
  })

  const handleMoveTask = async (task: TaskItem, targetColumn: BoardColumnId) => {
    const status = columnToStatus(targetColumn)
    updateStatusMutation.mutate({ taskId: task.id, status })
  }

  const quickUpdateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskRequest }) =>
      taskService.updateTask(taskId, payload),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks', selectedTeamId] })
      await queryClient.invalidateQueries({ queryKey: ['task', activeTaskId] })
    }
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Execution Board</p>
          <h1 className="text-2xl font-semibold text-gray-900">Kanban Board</h1>
        </div>
        {canCreateTasks ? (
          <Button onClick={() => setCreateModalOpen(true)} disabled={!selectedTeamId}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        ) : null}
      </header>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setViewMode('card')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
            viewMode === 'card' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Card mode
        </button>
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
            viewMode === 'table' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Rows3 className="h-4 w-4" />
          Table mode
        </button>
      </div>

      <Card
        title="Sprint Board"
        subtitle="Drag tasks across Backlog, Todo, In Progress, and Done. Changes sync with backend instantly."
      >
        {tasksQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading tasks...</p>
        ) : tasksQuery.data?.length ? (
          viewMode === 'card' ? (
            <KanbanBoard
              tasks={tasksQuery.data}
              onOpenTask={(taskId) => setActiveTaskId(taskId)}
              onMoveTask={handleMoveTask}
              onQuickUpdate={(taskId, payload) => quickUpdateMutation.mutate({ taskId, payload })}
              members={membersQuery.data ?? []}
              canManageFields={canCreateTasks}
            />
          ) : (
            <KanbanTableView
              tasks={tasksQuery.data}
              onOpenTask={(taskId) => setActiveTaskId(taskId)}
              onMoveTask={handleMoveTask}
            />
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No tasks yet for this team.</p>
            {canCreateTasks ? (
              <Button className="mt-3" onClick={() => setCreateModalOpen(true)} disabled={!selectedTeamId}>
                Add first task
              </Button>
            ) : null}
          </div>
        )}
      </Card>

      {selectedTeamId && canCreateTasks ? (
        <CreateTaskModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} teamId={selectedTeamId} />
      ) : null}

      {selectedTeamId ? (
        <TaskDrawer
          open={Boolean(activeTaskId)}
          taskId={activeTaskId}
          teamId={selectedTeamId}
          members={membersQuery.data ?? []}
          onClose={() => setActiveTaskId(null)}
        />
      ) : null}
    </div>
  )
}
