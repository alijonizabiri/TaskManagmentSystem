import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Activity, CheckCheck, ListChecks, Plus, Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { teamService } from '@/services/teamService'
import { taskService } from '@/services/taskService'
import { useAuth } from '@/hooks/useAuth'
import type { TaskItem, TaskPriority, UpdateTaskRequest } from '@/types/task'
import { boardColumns, columnToStatus, getBoardColumnId, taskPriorityLabel } from '@/utils/task'

type StatusFilter = 'all' | 'backlog' | 'todo' | 'inprogress' | 'done'

export const TeamWorkspacePage = () => {
  const { teamId } = useParams<{ teamId: string }>()
  const queryClient = useQueryClient()
  const { canCreateTasks, canInviteUsers } = useAuth()

  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamService.getTeam(teamId!),
    enabled: Boolean(teamId)
  })

  const teamStatsQuery = useQuery({
    queryKey: ['team-stats', teamId],
    queryFn: () => teamService.getTeamStats(teamId!),
    enabled: Boolean(teamId)
  })

  const membersQuery = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamService.getTeamMembers(teamId!),
    enabled: Boolean(teamId)
  })

  const tasksQuery = useQuery({
    queryKey: ['team-tasks', teamId],
    queryFn: () => teamService.getTeamTasks(teamId!),
    enabled: Boolean(teamId)
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: number }) =>
      taskService.updateTaskStatus(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['team-tasks', teamId] })
      const previousTasks = queryClient.getQueryData<TaskItem[]>(['team-tasks', teamId])

      queryClient.setQueryData<TaskItem[]>(['team-tasks', teamId], (current) =>
        (current ?? []).map((task) => (task.id === taskId ? { ...task, status } : task))
      )

      return { previousTasks }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['team-tasks', teamId], context.previousTasks)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team-tasks', teamId] })
      await queryClient.invalidateQueries({ queryKey: ['team-stats', teamId] })
    }
  })

  const filteredTasks = useMemo(() => {
    const tasks = tasksQuery.data ?? []

    return tasks.filter((task) => {
      const searchQuery = search.trim().toLowerCase()
      if (searchQuery) {
        const inTitle = task.title.toLowerCase().includes(searchQuery)
        const inDescription = (task.description ?? '').toLowerCase().includes(searchQuery)
        if (!inTitle && !inDescription) {
          return false
        }
      }

      if (assigneeFilter && task.assigneeId !== assigneeFilter) {
        return false
      }

      if (priorityFilter && String(task.priority) !== priorityFilter) {
        return false
      }

      if (statusFilter !== 'all') {
        const taskColumn = getBoardColumnId(task)
        if (taskColumn !== statusFilter) {
          return false
        }
      }

      return true
    })
  }, [tasksQuery.data, search, assigneeFilter, priorityFilter, statusFilter])

  const handleMoveTask = (task: TaskItem, targetColumn: 'backlog' | 'todo' | 'inprogress' | 'done') => {
    const status = columnToStatus(targetColumn)
    updateStatusMutation.mutate({ taskId: task.id, status })
  }

  const quickUpdateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskRequest }) =>
      taskService.updateTask(taskId, payload),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team-tasks', teamId] })
      await queryClient.invalidateQueries({ queryKey: ['team-stats', teamId] })
      await queryClient.invalidateQueries({ queryKey: ['task', activeTaskId] })
    }
  })

  if (!teamId) {
    return (
      <Card title="Team Workspace">
        <p className="text-sm text-gray-500">Team is not selected.</p>
      </Card>
    )
  }

  if (teamQuery.isError) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Team Workspace</p>
          <h1 className="text-2xl font-semibold text-gray-900">{teamQuery.data?.name ?? 'Team'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canInviteUsers ? (
            <Link
              to={`/teams/${teamId}/invite`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Invite Members
            </Link>
          ) : null}

          {canCreateTasks ? (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Backlog" value={teamStatsQuery.data?.backlog ?? 0} icon={ListChecks} accentClass="text-brand-warning" />
        <StatCard title="Todo" value={teamStatsQuery.data?.todo ?? 0} icon={Timer} accentClass="text-brand-info" />
        <StatCard
          title="In Progress"
          value={teamStatsQuery.data?.inProgress ?? 0}
          icon={Activity}
          accentClass="text-brand-primary"
        />
        <StatCard title="Done" value={teamStatsQuery.data?.done ?? 0} icon={CheckCheck} accentClass="text-brand-success" />
      </section>

      <Card title="Filters" subtitle="Filter tasks by user, priority, status, and search">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select label="User" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
            <option value="">All users</option>
            {(membersQuery.data ?? []).map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName}
              </option>
            ))}
          </Select>

          <Select label="Priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="">All priorities</option>
            <option value="0">{taskPriorityLabel[0 as TaskPriority]}</option>
            <option value="1">{taskPriorityLabel[1 as TaskPriority]}</option>
            <option value="2">{taskPriorityLabel[2 as TaskPriority]}</option>
            <option value="3">{taskPriorityLabel[3 as TaskPriority]}</option>
          </Select>

          <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">All statuses</option>
            {boardColumns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </Select>

          <Input
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
          />
        </div>
      </Card>

      <Card title="Kanban Board" subtitle="Drag tasks across Backlog, Todo, In Progress, and Done">
        {tasksQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading tasks...</p>
        ) : filteredTasks.length ? (
          <KanbanBoard
            tasks={filteredTasks}
            onOpenTask={(taskId) => setActiveTaskId(taskId)}
            onMoveTask={handleMoveTask}
            onQuickUpdate={(taskId, payload) => quickUpdateMutation.mutate({ taskId, payload })}
            members={membersQuery.data ?? []}
            canManageFields={canCreateTasks}
          />
        ) : (
          <p className="text-sm text-gray-500">No tasks match the selected filters.</p>
        )}
      </Card>

      {canCreateTasks ? (
        <CreateTaskModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} teamId={teamId} />
      ) : null}

      <TaskDrawer
        open={Boolean(activeTaskId)}
        taskId={activeTaskId}
        teamId={teamId}
        members={membersQuery.data ?? []}
        onClose={() => setActiveTaskId(null)}
      />
    </div>
  )
}
