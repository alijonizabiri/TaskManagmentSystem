import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { teamService } from '@/services/teamService'
import { taskService } from '@/services/taskService'
import { useEnsureSelectedTeam } from '@/hooks/useEnsureSelectedTeam'
import { formatDateTime, timeAgo } from '@/utils/format'

export const ActivitiesPage = () => {
  const [createdByUserId, setCreatedByUserId] = useState('')

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams
  })

  const { selectedTeamId } = useEnsureSelectedTeam(teamsQuery.data)

  const membersQuery = useQuery({
    queryKey: ['team-members', selectedTeamId],
    queryFn: () => teamService.getTeamMembers(selectedTeamId!),
    enabled: Boolean(selectedTeamId)
  })

  const activitiesQuery = useQuery({
    queryKey: ['task-activities', selectedTeamId, createdByUserId],
    queryFn: () => taskService.getActivities(selectedTeamId!, createdByUserId || undefined),
    enabled: Boolean(selectedTeamId)
  })

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Workspace</p>
        <h1 className="text-2xl font-semibold text-gray-900">All Activities</h1>
      </header>

      <Card title="Filters" subtitle="Filter activities by user">
        <div className="max-w-sm">
          <Select
            label="Created By"
            value={createdByUserId}
            onChange={(event) => setCreatedByUserId(event.target.value)}
          >
            <option value="">All users</option>
            {(membersQuery.data ?? []).map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card title="Activity Feed" subtitle="Latest task activity in your selected team">
        {activitiesQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading activities...</p>
        ) : activitiesQuery.data?.length ? (
          <div className="space-y-3">
            {activitiesQuery.data.map((task) => (
              <div key={task.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Created by {task.createdByName} {timeAgo(task.createdAt)}
                </p>
                <p className="text-xs text-gray-500">Created At: {formatDateTime(task.createdAt)}</p>
                <p className="text-xs text-gray-500">Deadline: {formatDateTime(task.deadline)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No activities found for this filter.</p>
        )}
      </Card>
    </div>
  )
}
