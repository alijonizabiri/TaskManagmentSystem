import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { adminService } from '@/services/adminService'
import { Role } from '@/types/team'
import { roleLabelMap } from '@/utils/team'
import { formatDateTime } from '@/utils/format'

export const UserManagementPage = () => {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => adminService.updateUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Administration</p>
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
      </header>

      <Card title="All Users" subtitle="View users and update global role">
        {usersQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading users...</p>
        ) : usersQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-[0.1em] text-gray-500">
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Approved</th>
                  <th className="px-2 py-3">Role</th>
                  <th className="px-2 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-2 py-3 font-medium text-gray-800">{user.fullName}</td>
                    <td className="px-2 py-3 text-gray-600">{user.email}</td>
                    <td className="px-2 py-3 text-gray-600">{user.isApproved ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-3">
                      <Select
                        value={String(user.role)}
                        onChange={(event) =>
                          updateRoleMutation.mutate({ userId: user.id, role: Number(event.target.value) as Role })
                        }
                      >
                        <option value={Role.Admin}>Admin</option>
                        <option value={Role.TeamLead}>Team Lead</option>
                        <option value={Role.User}>User</option>
                      </Select>
                    </td>
                    <td className="px-2 py-3 text-gray-500">{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No users found.</p>
        )}

        {updateRoleMutation.error ? (
          <p className="mt-3 text-sm text-red-600">{updateRoleMutation.error.message}</p>
        ) : null}
      </Card>

      <Card title="Role Legend" subtitle="Global role definitions">
        <ul className="space-y-2 text-sm text-gray-600">
          <li>Admin: full system visibility and control.</li>
          <li>Team Lead: manages teams they belong to.</li>
          <li>User: works within assigned teams.</li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          Available roles: {Object.values(Role).filter((value) => typeof value === 'number').map((value) => roleLabelMap[value as Role]).join(', ')}
        </p>
      </Card>
    </div>
  )
}