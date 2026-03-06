import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { MailPlus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { teamService } from '@/services/teamService'
import { useInviteStore } from '@/store/inviteStore'
import { Role } from '@/types/team'
import { formatDateTime } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'

import { roleLabelMap } from '@/utils/team'

export const InviteMembersPage = () => {
  const { teamId } = useParams<{ teamId: string }>()
  const { canInviteUsers } = useAuth()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>(Role.User)
  const addInvite = useInviteStore((state) => state.addInvite)
  const pendingInvites = useInviteStore((state) => (teamId ? state.invitesByTeam[teamId] ?? [] : []))

  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamService.getTeam(teamId!),
    enabled: Boolean(teamId)
  })

  const inviteMutation = useMutation({
    mutationFn: () => teamService.inviteMember(teamId!, { email, role }),
    onSuccess: (payload) => {
      addInvite(teamId!, {
        id: crypto.randomUUID(),
        email,
        role,
        token: payload.token,
        createdAt: new Date().toISOString()
      })
      setEmail('')
      setRole(Role.User)
    }
  })

  const teamName = useMemo(
    () => teamQuery.data?.name ?? 'Team',
    [teamQuery.data]
  )

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Team Collaboration</p>
        <h1 className="text-2xl font-semibold text-gray-900">Invite Members - {teamName}</h1>
      </header>

      <Card title="Send Invitation" subtitle="Invite teammates with role-based access">
        <form
          className="grid gap-3 md:grid-cols-[2fr_1fr_auto] md:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            if (!teamId) {
              return
            }
            if (!canInviteUsers) {
              return
            }
            inviteMutation.mutate()
          }}
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@company.com"
            required
          />

          <Select label="Role" value={String(role)} onChange={(event) => setRole(Number(event.target.value) as Role)}>
            <option value={Role.TeamLead}>Team Lead</option>
            <option value={Role.User}>User</option>
          </Select>

          <Button loading={inviteMutation.isPending} disabled={!teamId || !email || !canInviteUsers}>
            <MailPlus className="mr-2 h-4 w-4" />
            Invite
          </Button>
        </form>

        {!canInviteUsers ? (
          <p className="mt-3 text-sm text-amber-700">Only Admin and TeamLead can send invitations.</p>
        ) : null}
        {inviteMutation.error ? <p className="mt-3 text-sm text-red-600">{inviteMutation.error.message}</p> : null}
      </Card>

      <Card title="Pending Invitations" subtitle="API does not expose invite listing yet; showing this-session invites">
        {pendingInvites.length ? (
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <article key={invite.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                  <Badge color="warning">Pending</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>Role: {roleLabelMap[invite.role]}</span>
                  <span>Created: {formatDateTime(invite.createdAt)}</span>
                  <span className="max-w-full truncate">Token: {invite.token}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No pending invitations yet.</p>
        )}
      </Card>
    </div>
  )
}

