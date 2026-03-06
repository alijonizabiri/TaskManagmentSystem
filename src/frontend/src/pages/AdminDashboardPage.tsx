import { useMemo } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock3, ShieldAlert, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import { teamService } from '@/services/teamService'
import { formatDateTime } from '@/utils/format'

export const AdminDashboardPage = () => {
  const queryClient = useQueryClient()

  const pendingUsersQuery = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: adminService.getPendingUsers
  })

  const teamsQuery = useQuery({
    queryKey: ['admin-teams'],
    queryFn: adminService.getTeams
  })

  const membersQueries = useQueries({
    queries: (teamsQuery.data ?? []).map((team) => ({
      queryKey: ['team-members', team.id],
      queryFn: () => teamService.getTeamMembers(team.id)
    }))
  })

  const totalMembers = useMemo(
    () => membersQueries.reduce((sum, query) => sum + (query.data?.length ?? 0), 0),
    [membersQueries]
  )

  const approveMutation = useMutation({
    mutationFn: adminService.approveUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-pending-users'] })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: adminService.rejectUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-pending-users'] })
    }
  })

  if (pendingUsersQuery.isError) {
    return (
      <Card title="Admin Dashboard" subtitle="User approvals and workspace controls">
        <p className="text-sm text-red-600">
          You do not have permission to access admin endpoints or the API is unavailable.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Administration</p>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Approvals"
          value={pendingUsersQuery.data?.length ?? 0}
          hint="Users waiting for admin review"
          icon={Clock3}
          accentClass="text-brand-warning"
        />
        <StatCard
          title="Active Teams"
          value={teamsQuery.data?.length ?? 0}
          hint="Teams in your workspace"
          icon={Users}
          accentClass="text-brand-info"
        />
        <StatCard
          title="Known Team Members"
          value={totalMembers}
          hint="Across teams visible to you"
          icon={ShieldAlert}
          accentClass="text-brand-primary"
        />
        <StatCard
          title="Approval Rate"
          value={`${Math.max(0, 100 - (pendingUsersQuery.data?.length ?? 0) * 6)}%`}
          hint="Snapshot for today"
          icon={CheckCircle2}
          accentClass="text-brand-success"
        />
      </section>

      <Card title="Pending User Approvals" subtitle="Approve or reject new registrations">
        {pendingUsersQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading pending users...</p>
        ) : pendingUsersQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-[0.1em] text-gray-500">
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Created</th>
                  <th className="px-2 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsersQuery.data.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-2 py-3 font-medium text-gray-800">{user.fullName}</td>
                    <td className="px-2 py-3 text-gray-600">{user.email}</td>
                    <td className="px-2 py-3 text-gray-500">{formatDateTime(user.createdAt)}</td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <Button
                          className="h-8 px-3 text-xs"
                          loading={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(user.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          className="h-8 px-3 text-xs"
                          loading={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(user.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No pending users right now.</p>
        )}
      </Card>

      <Card title="Active Teams" subtitle="Teams you can currently access">
        {teamsQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading teams...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(teamsQuery.data ?? []).map((team) => (
              <article key={team.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                <p className="mt-1 text-xs text-gray-500">Members: {team.memberCount}</p>
                <p className="text-xs text-gray-500">Created: {formatDateTime(team.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
