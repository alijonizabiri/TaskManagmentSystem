import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, CheckCircle2, Clock3, FolderKanban, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { adminService } from '@/services/adminService'

export const AdminDashboardPage = () => {
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard
  })

  const teamPerformanceQuery = useQuery({
    queryKey: ['admin-team-performance'],
    queryFn: adminService.getTeamPerformance
  })

  const userPerformanceQuery = useQuery({
    queryKey: ['admin-user-performance'],
    queryFn: adminService.getUserPerformance
  })

  const bestTeam = useMemo(
    () => (teamPerformanceQuery.data ?? []).find((row) => row.isTopPerformer),
    [teamPerformanceQuery.data]
  )

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Global Admin</p>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Users"
          value={dashboardQuery.data?.totalUsers ?? 0}
          icon={Users}
          accentClass="text-brand-primary"
        />
        <StatCard
          title="Total Teams"
          value={dashboardQuery.data?.totalTeams ?? 0}
          icon={FolderKanban}
          accentClass="text-brand-info"
        />
        <StatCard
          title="Total Tasks"
          value={dashboardQuery.data?.totalTasks ?? 0}
          icon={Clock3}
          accentClass="text-brand-warning"
        />
        <StatCard
          title="Completed %"
          value={`${dashboardQuery.data?.completedTasksPercentage ?? 0}%`}
          icon={CheckCircle2}
          accentClass="text-brand-success"
        />
        <StatCard
          title="Overdue %"
          value={`${dashboardQuery.data?.overdueTasksPercentage ?? 0}%`}
          icon={Award}
          accentClass="text-brand-warning"
        />
      </section>

      <Card title="Team Performance Ranking" subtitle="Sorted by completion percentage">
        {teamPerformanceQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading team performance...</p>
        ) : teamPerformanceQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-[0.1em] text-gray-500">
                  <th className="px-2 py-3">Team</th>
                  <th className="px-2 py-3">Total Tasks</th>
                  <th className="px-2 py-3">Completed</th>
                  <th className="px-2 py-3">Completion %</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformanceQuery.data.map((row) => (
                  <tr
                    key={row.teamId}
                    className={`border-b border-gray-100 last:border-b-0 ${row.isTopPerformer ? 'bg-green-50' : ''}`}
                  >
                    <td className="px-2 py-3 font-medium text-gray-800">
                      {row.teamName}
                      {row.isTopPerformer ? <span className="ml-2 text-xs font-semibold text-green-700">Top Team</span> : null}
                    </td>
                    <td className="px-2 py-3 text-gray-600">{row.totalTasks}</td>
                    <td className="px-2 py-3 text-gray-600">{row.completedTasks}</td>
                    <td className="px-2 py-3 text-gray-700">{row.completionPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No teams found.</p>
        )}
      </Card>

      <Card title="Top Performing Users" subtitle="Users with highest completed tasks">
        {userPerformanceQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading user performance...</p>
        ) : userPerformanceQuery.data?.length ? (
          <div className="space-y-3">
            {userPerformanceQuery.data.map((user) => (
              <article key={user.userId} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-100 text-center text-sm font-semibold leading-9 text-indigo-700">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-indigo-700">{user.completedTasks} completed</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No completed tasks yet.</p>
        )}

        {bestTeam ? (
          <p className="mt-4 text-xs font-medium text-green-700">Best performing team: {bestTeam.teamName}</p>
        ) : null}
      </Card>
    </div>
  )
}