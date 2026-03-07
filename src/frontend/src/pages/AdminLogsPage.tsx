import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import { formatDateTime } from '@/utils/format'

const PAGE_SIZE = 10

const getActionBadgeClass = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
      return 'bg-green-100 text-green-700'
    case 'update':
      return 'bg-blue-100 text-blue-700'
    case 'delete':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export const AdminLogsPage = () => {
  const [action, setAction] = useState('')
  const [entityName, setEntityName] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const usersQuery = useQuery({
    queryKey: ['admin-users', 'approved'],
    queryFn: () => adminService.getUsers('approved')
  })

  const logsQuery = useQuery({
    queryKey: ['admin-logs', action, entityName, actorUserId, search, page],
    queryFn: () =>
      adminService.getActivityLogs({
        action: action || undefined,
        entityName: entityName || undefined,
        actorUserId: actorUserId || undefined,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE
      }),
    staleTime: 0,
    refetchOnMount: 'always'
  })

  const result = logsQuery.data

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Administration</p>
        <h1 className="text-2xl font-semibold text-gray-900">Activity Logs</h1>
      </header>

      <Card title="Filters" subtitle="Filter admin create/update/delete activity">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All actions</option>
            <option value="Create">Create</option>
            <option value="Update">Update</option>
            <option value="Delete">Delete</option>
          </Select>

          <Select
            label="Entity"
            value={entityName}
            onChange={(event) => {
              setEntityName(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All entities</option>
            <option value="User">User</option>
            <option value="Team">Team</option>
            <option value="Task">Task</option>
            <option value="TeamMember">TeamMember</option>
            <option value="TeamInvite">TeamInvite</option>
          </Select>

          <Select
            label="Actor"
            value={actorUserId}
            onChange={(event) => {
              setActorUserId(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All actors</option>
            {(usersQuery.data ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </Select>

          <Input
            label="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search actor or description"
          />
        </div>
      </Card>

      <Card title="Logs" subtitle="Newest activity first">
        {logsQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading logs...</p>
        ) : result?.items.length ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-2 py-2">Time</th>
                    <th className="px-2 py-2">Actor</th>
                    <th className="px-2 py-2">Action</th>
                    <th className="px-2 py-2">Entity</th>
                    <th className="px-2 py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 align-top last:border-b-0 hover:bg-gray-50">
                      <td className="px-2 py-3 whitespace-nowrap text-gray-600">{formatDateTime(log.createdAt)}</td>
                      <td className="px-2 py-3 font-medium text-gray-800">{log.actorName}</td>
                      <td className="px-2 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-gray-700">{log.entityName}</td>
                      <td className="px-2 py-3 text-gray-700">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-500">
                Page {result.page} of {Math.max(result.totalPages, 1)} ({result.totalCount} records)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={result.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPage((previous) => previous + 1)}
                  disabled={result.page >= result.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No logs found for selected filters.</p>
        )}
      </Card>
    </div>
  )
}
