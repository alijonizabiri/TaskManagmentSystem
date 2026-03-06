import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { adminService } from '@/services/adminService'
import { Activity, Clock3, FolderKanban, Users } from 'lucide-react'

export const SystemStatisticsPage = () => {
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers()
  })

  const teamsQuery = useQuery({
    queryKey: ['admin-teams'],
    queryFn: adminService.getTeams
  })

  const tasksQuery = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: adminService.getTasks
  })

  const pendingApprovals = (usersQuery.data ?? []).filter((user) => !user.isApproved).length

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Administration</p>
        <h1 className="text-2xl font-semibold text-gray-900">System Statistics</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={usersQuery.data?.length ?? 0} icon={Users} accentClass="text-brand-primary" />
        <StatCard title="Total Teams" value={teamsQuery.data?.length ?? 0} icon={FolderKanban} accentClass="text-brand-info" />
        <StatCard title="Total Tasks" value={tasksQuery.data?.length ?? 0} icon={Activity} accentClass="text-brand-success" />
        <StatCard title="Pending Approvals" value={pendingApprovals} icon={Clock3} accentClass="text-brand-warning" />
      </section>

      <Card title="System Health" subtitle="Realtime snapshot based on API data">
        <ul className="space-y-2 text-sm text-gray-600">
          <li>Users loaded: {usersQuery.isLoading ? 'Loading...' : 'Ready'}</li>
          <li>Teams loaded: {teamsQuery.isLoading ? 'Loading...' : 'Ready'}</li>
          <li>Tasks loaded: {tasksQuery.isLoading ? 'Loading...' : 'Ready'}</li>
        </ul>
      </Card>
    </div>
  )
}
