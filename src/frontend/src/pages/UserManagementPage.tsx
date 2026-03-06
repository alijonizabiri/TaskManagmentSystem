import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { adminService, type AdminUser } from '@/services/adminService'
import { Role } from '@/types/team'
import { roleLabelMap } from '@/utils/team'
import { formatDateTime } from '@/utils/format'

type StatusFilter = 'all' | 'pending' | 'approved'

const PAGE_SIZE = 8

const roleBadgeColorMap: Record<Role, 'primary' | 'info' | 'gray'> = {
  [Role.Admin]: 'primary',
  [Role.TeamLead]: 'info',
  [Role.User]: 'gray'
}

export const UserManagementPage = () => {
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const apiStatusFilter = statusFilter === 'all' ? undefined : statusFilter

  const usersQuery = useQuery({
    queryKey: ['admin-users', apiStatusFilter],
    queryFn: () => adminService.getUsers(apiStatusFilter)
  })

  const pendingUsersQuery = useQuery({
    queryKey: ['admin-users', 'pending'],
    queryFn: () => adminService.getUsers('pending')
  })

  const approveMutation = useMutation({
    mutationFn: adminService.approveUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: adminService.rejectUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => adminService.updateUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? []
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return users
    }

    return users.filter((user) => {
      const byName = user.fullName.toLowerCase().includes(query)
      const byEmail = user.email.toLowerCase().includes(query)
      return byName || byEmail
    })
  }, [usersQuery.data, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const renderStatusBadge = (user: AdminUser) =>
    user.isApproved ? <Badge color="success">Approved</Badge> : <Badge color="warning">Pending</Badge>

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Administration</p>
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Pending Approvals" subtitle="Users waiting for admin review">
          <p className="text-3xl font-semibold text-amber-600">{pendingUsersQuery.data?.length ?? 0}</p>
          <p className="mt-1 text-xs text-gray-500">{pendingUsersQuery.data?.length ?? 0} users</p>
        </Card>
      </section>

      <Card title="Users" subtitle="Search, filter, approve, reject, and manage user roles">
        <div className="mb-4 grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">All Users</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved Users</option>
          </Select>
        </div>

        {usersQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading users...</p>
        ) : paginatedUsers.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-[0.1em] text-gray-500">
                    <th className="px-2 py-3">Name</th>
                    <th className="px-2 py-3">Email</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Role</th>
                    <th className="px-2 py-3">Created</th>
                    <th className="px-2 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50">
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-center text-sm font-semibold leading-8 text-indigo-700">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-800">{user.fullName}</p>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-gray-600">{user.email}</td>
                      <td className="px-2 py-3">{renderStatusBadge(user)}</td>
                      <td className="px-2 py-3">
                        {user.isApproved ? (
                          <Select
                            value={String(user.role)}
                            onChange={(event) =>
                              updateRoleMutation.mutate({ userId: user.id, role: Number(event.target.value) as Role })
                            }
                          >
                            <option value={Role.User}>User</option>
                            <option value={Role.TeamLead}>Team Lead</option>
                            <option value={Role.Admin}>Admin</option>
                          </Select>
                        ) : (
                          <Badge color={roleBadgeColorMap[user.role]}>{roleLabelMap[user.role]}</Badge>
                        )}
                      </td>
                      <td className="px-2 py-3 text-gray-500">{formatDateTime(user.createdAt)}</td>
                      <td className="px-2 py-3">
                        {!user.isApproved ? (
                          <div className="flex flex-wrap gap-2">
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
                        ) : (
                          <p className="text-xs font-medium text-gray-500">Role editable</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of{' '}
                {filteredUsers.length}
              </p>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button variant="secondary" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">No users found for the selected filter.</p>
        )}

        {approveMutation.error ? <p className="mt-3 text-sm text-red-600">{approveMutation.error.message}</p> : null}
        {rejectMutation.error ? <p className="mt-3 text-sm text-red-600">{rejectMutation.error.message}</p> : null}
        {updateRoleMutation.error ? <p className="mt-3 text-sm text-red-600">{updateRoleMutation.error.message}</p> : null}
      </Card>
    </div>
  )
}