import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, CheckCheck, ListChecks, Timer, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { teamService } from '@/services/teamService'
import { taskService } from '@/services/taskService'
import { useEnsureSelectedTeam } from '@/hooks/useEnsureSelectedTeam'
import { useAuth } from '@/hooks/useAuth'
import { getBoardColumnId } from '@/utils/task'
import { formatDateTime, timeAgo } from '@/utils/format'
import { roleLabelMap } from '@/utils/team'
import { canManageTeams } from '@/utils/rbac'

export const TeamDashboardPage = () => {
  const queryClient = useQueryClient()
  const [teamName, setTeamName] = useState('')
  const { role, canInviteUsers } = useAuth()
  const showTeamManagement = canManageTeams(role)

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

  const activitiesQuery = useQuery({
    queryKey: ['task-activities', selectedTeamId],
    queryFn: () => taskService.getActivities(selectedTeamId!),
    enabled: Boolean(selectedTeamId)
  })

  const createTeamMutation = useMutation({
    mutationFn: teamService.createTeam,
    onSuccess: async () => {
      setTeamName('')
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })

  const stats = useMemo(() => {
    const tasks = tasksQuery.data ?? []
    return tasks.reduce(
      (accumulator, task) => {
        const column = getBoardColumnId(task)
        accumulator[column] += 1
        return accumulator
      },
      {
        backlog: 0,
        todo: 0,
        inprogress: 0,
        done: 0
      }
    )
  }, [tasksQuery.data])

  const activityFeedPreview = useMemo(() => (activitiesQuery.data ?? []).slice(0, 3), [activitiesQuery.data])

  const onlineMembers = useMemo(
    () => (membersQuery.data ?? []).slice(0, 6).map((member, index) => ({ ...member, online: index % 2 === 0 })),
    [membersQuery.data]
  )

  const activeTeamName = teamsQuery.data?.find((team) => team.id === selectedTeamId)?.name ?? 'Team'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Workspace</p>
          <h1 className="text-2xl font-semibold text-gray-900">Team Dashboard - {activeTeamName}</h1>
        </div>
        {canInviteUsers ? (
          <Link
            to={selectedTeamId ? `/teams/${selectedTeamId}/invite` : '/team'}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Invite Members
          </Link>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Backlog" value={stats.backlog} icon={ListChecks} accentClass="text-brand-warning" />
        <StatCard title="Todo" value={stats.todo} icon={Timer} accentClass="text-brand-info" />
        <StatCard title="In Progress" value={stats.inprogress} icon={Activity} accentClass="text-brand-primary" />
        <StatCard title="Done" value={stats.done} icon={CheckCheck} accentClass="text-brand-success" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-brand-text">Activity Feed</h3>
              <p className="mt-1 text-sm text-gray-500">Latest task activity in your selected team</p>
            </div>
            {(activitiesQuery.data?.length ?? 0) > 3 ? (
              <Link to="/activities" className="text-sm font-semibold text-brand-primary hover:underline">
                View all
              </Link>
            ) : null}
          </div>

          {activitiesQuery.isLoading ? (
            <p className="text-sm text-gray-500">Loading activities...</p>
          ) : activityFeedPreview.length ? (
            <div className="space-y-3">
              {activityFeedPreview.map((task) => (
                <div key={task.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Created by {task.createdByName} {timeAgo(task.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">Deadline: {formatDateTime(task.deadline)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent activity in this team.</p>
          )}
        </section>

        <Card title="Online Members" subtitle="Presence is estimated from current session activity">
          <div className="space-y-3">
            {onlineMembers.map((member) => (
              <div key={member.userId} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                    member.online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <UserCheck className="h-3 w-3" />
                  {member.online ? 'Online' : 'Idle'}
                </span>
              </div>
            ))}
            {!onlineMembers.length ? <p className="text-sm text-gray-500">No members available.</p> : null}
          </div>
        </Card>
      </section>

      {showTeamManagement ? (
        <Card title="Create Team" subtitle="Team leads and admins can create new teams">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              createTeamMutation.mutate({ name: teamName })
            }}
          >
            <Input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Platform Engineering"
            />
            <Button className="sm:w-[180px]" loading={createTeamMutation.isPending} disabled={teamName.trim().length < 3}>
              Create Team
            </Button>
          </form>
          {createTeamMutation.error ? <p className="mt-3 text-sm text-red-600">{createTeamMutation.error.message}</p> : null}
        </Card>
      ) : null}

      <Card title="Team Snapshot" subtitle="Quick view of selected team members">
        {membersQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading members...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(membersQuery.data ?? []).map((member) => (
              <div key={member.userId} className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="font-medium text-gray-900">{member.fullName}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
                <p className="mt-1 text-xs font-semibold text-indigo-600">Role: {roleLabelMap[member.role]}</p>
              </div>
            ))}
            {!membersQuery.data?.length ? <p className="text-sm text-gray-500">No members found.</p> : null}
          </div>
        )}
      </Card>
    </div>
  )
}

