import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { teamService } from '@/services/teamService'
import { adminService } from '@/services/adminService'
import { useAuth } from '@/hooks/useAuth'
import { canManageTeams } from '@/utils/rbac'
import { Role } from '@/types/team'
import type { Team } from '@/types/team'

type TeamLeadSelectorProps = {
  isAdmin: boolean
  currentUserName: string
  searchValue: string
  onSearchValueChange: (value: string) => void
  selectedTeamLeadId: string | null
  onSelectedTeamLeadIdChange: (value: string | null) => void
  isDropdownOpen: boolean
  onDropdownOpenChange: (value: boolean) => void
  options: Array<{ id: string; fullName: string; email: string }>
  isLoading: boolean
}

const TeamLeadSelector = ({
  isAdmin,
  currentUserName,
  searchValue,
  onSearchValueChange,
  selectedTeamLeadId,
  onSelectedTeamLeadIdChange,
  isDropdownOpen,
  onDropdownOpenChange,
  options,
  isLoading
}: TeamLeadSelectorProps) => {
  const filteredOptions = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase()
    if (!normalized) {
      return options
    }

    return options.filter(
      (option) => option.fullName.toLowerCase().includes(normalized) || option.email.toLowerCase().includes(normalized)
    )
  }, [options, searchValue])

  return (
    <div className="space-y-1.5 text-sm font-medium text-gray-700">
      <span>Team Lead</span>
      {isAdmin ? (
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input
              value={searchValue}
              onChange={(event) => {
                onSearchValueChange(event.target.value)
                onDropdownOpenChange(true)
                onSelectedTeamLeadIdChange(null)
              }}
              onFocus={() => onDropdownOpenChange(true)}
              onBlur={() => setTimeout(() => onDropdownOpenChange(false), 120)}
              placeholder="Search TeamLead by name or email"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {isDropdownOpen ? (
            <div className="absolute z-10 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
              {isLoading ? (
                <p className="px-3 py-2 text-xs text-gray-500">Loading users...</p>
              ) : filteredOptions.length ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onMouseDown={() => {
                      onSelectedTeamLeadIdChange(option.id)
                      onSearchValueChange(`${option.fullName} (${option.email})`)
                      onDropdownOpenChange(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {option.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-medium text-gray-900">{option.fullName}</span>
                      <span className="block text-xs text-gray-500">{option.email}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-500">No TeamLead users found.</p>
              )}
            </div>
          ) : null}

          {selectedTeamLeadId ? (
            <button
              type="button"
              onClick={() => {
                onSelectedTeamLeadIdChange(null)
                onSearchValueChange('')
              }}
              className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear selection
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          {currentUserName} will be the lead for this team.
        </div>
      )}
    </div>
  )
}

export const TeamsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role, user } = useAuth()
  const canCreateTeam = canManageTeams(role)
  const isAdmin = role === Role.Admin

  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [teamLeadSearch, setTeamLeadSearch] = useState('')
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState<string | null>(null)
  const [teamLeadDropdownOpen, setTeamLeadDropdownOpen] = useState(false)

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editTeamDescription, setEditTeamDescription] = useState('')
  const [editTeamLeadSearch, setEditTeamLeadSearch] = useState('')
  const [selectedEditTeamLeadId, setSelectedEditTeamLeadId] = useState<string | null>(null)
  const [editTeamLeadDropdownOpen, setEditTeamLeadDropdownOpen] = useState(false)

  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams
  })

  const approvedUsersQuery = useQuery({
    queryKey: ['admin-users', 'approved'],
    queryFn: () => adminService.getUsers('approved'),
    enabled: isAdmin && (isCreateModalOpen || isEditModalOpen)
  })

  const teamLeadOptions = useMemo(
    () => (approvedUsersQuery.data ?? []).filter((userOption) => userOption.role === Role.TeamLead),
    [approvedUsersQuery.data]
  )

  const resetCreateTeamForm = () => {
    setTeamName('')
    setTeamDescription('')
    setTeamLeadSearch('')
    setSelectedTeamLeadId(null)
    setTeamLeadDropdownOpen(false)
  }

  const closeCreateModal = () => {
    setCreateModalOpen(false)
    resetCreateTeamForm()
  }

  const resetEditTeamForm = () => {
    setEditingTeamId(null)
    setEditTeamName('')
    setEditTeamDescription('')
    setEditTeamLeadSearch('')
    setSelectedEditTeamLeadId(null)
    setEditTeamLeadDropdownOpen(false)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    resetEditTeamForm()
  }

  const openEditModal = (team: Team) => {
    setEditingTeamId(team.id)
    setEditTeamName(team.name)
    setEditTeamDescription(team.description ?? '')
    setEditTeamLeadSearch('')
    setSelectedEditTeamLeadId(null)
    setEditTeamLeadDropdownOpen(false)
    setEditModalOpen(true)
  }

  const createTeamMutation = useMutation({
    mutationFn: () =>
      teamService.createTeam({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
        teamLeadId: selectedTeamLeadId ?? undefined
      }),
    onSuccess: async () => {
      closeCreateModal()
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-teams'] })
    }
  })

  const updateTeamMutation = useMutation({
    mutationFn: (payload: { teamId: string; name: string; description?: string; teamLeadId?: string }) =>
      teamService.updateTeam(payload.teamId, {
        name: payload.name,
        description: payload.description,
        teamLeadId: payload.teamLeadId
      }),
    onSuccess: async () => {
      closeEditModal()
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-teams'] })
    }
  })

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: async () => {
      setTeamToDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-teams'] })
    }
  })

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Workspace</p>
          <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
        </div>
        {canCreateTeam ? (
          <Button className="h-10 shrink-0 gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        ) : null}
      </header>

      <Modal open={isCreateModalOpen} title="Create Team" onClose={closeCreateModal} className="max-w-3xl p-0" hideHeader>
        <div className="overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">Create Team</h2>
            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative h-32 bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_40%)]" />
            <div className="absolute bottom-4 left-5 rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-gray-700">
              Team Setup
            </div>
          </div>
          <form
            className="space-y-4 p-5"
            onSubmit={(event) => {
              event.preventDefault()
              createTeamMutation.mutate()
            }}
          >
            <Input
              label="Team Name"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Platform Engineering"
              required
            />

            <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-gray-700">
              <span>Description</span>
              <textarea
                value={teamDescription}
                onChange={(event) => setTeamDescription(event.target.value)}
                placeholder="What this team owns and delivers..."
                rows={4}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
              />
            </label>

            <TeamLeadSelector
              isAdmin={isAdmin}
              currentUserName={user?.fullName ?? 'Current user'}
              searchValue={teamLeadSearch}
              onSearchValueChange={setTeamLeadSearch}
              selectedTeamLeadId={selectedTeamLeadId}
              onSelectedTeamLeadIdChange={setSelectedTeamLeadId}
              isDropdownOpen={teamLeadDropdownOpen}
              onDropdownOpenChange={setTeamLeadDropdownOpen}
              options={teamLeadOptions}
              isLoading={approvedUsersQuery.isLoading}
            />

            {createTeamMutation.error ? <p className="text-sm text-red-600">{createTeamMutation.error.message}</p> : null}

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="secondary" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button type="submit" loading={createTeamMutation.isPending} disabled={teamName.trim().length < 3}>
                Create Team
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal open={isEditModalOpen} title="Edit Team" onClose={closeEditModal} className="max-w-3xl p-0" hideHeader>
        <div className="overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">Edit Team</h2>
            <button
              type="button"
              onClick={closeEditModal}
              className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            className="space-y-4 p-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!editingTeamId) {
                return
              }

              updateTeamMutation.mutate({
                teamId: editingTeamId,
                name: editTeamName.trim(),
                description: editTeamDescription.trim() || undefined,
                teamLeadId: selectedEditTeamLeadId ?? undefined
              })
            }}
          >
            <Input
              label="Team Name"
              value={editTeamName}
              onChange={(event) => setEditTeamName(event.target.value)}
              placeholder="Platform Engineering"
              required
            />

            <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-gray-700">
              <span>Description</span>
              <textarea
                value={editTeamDescription}
                onChange={(event) => setEditTeamDescription(event.target.value)}
                placeholder="What this team owns and delivers..."
                rows={4}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
              />
            </label>

            <TeamLeadSelector
              isAdmin={isAdmin}
              currentUserName={user?.fullName ?? 'Current user'}
              searchValue={editTeamLeadSearch}
              onSearchValueChange={setEditTeamLeadSearch}
              selectedTeamLeadId={selectedEditTeamLeadId}
              onSelectedTeamLeadIdChange={setSelectedEditTeamLeadId}
              isDropdownOpen={editTeamLeadDropdownOpen}
              onDropdownOpenChange={setEditTeamLeadDropdownOpen}
              options={teamLeadOptions}
              isLoading={approvedUsersQuery.isLoading}
            />

            {updateTeamMutation.error ? <p className="text-sm text-red-600">{updateTeamMutation.error.message}</p> : null}

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="secondary" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button type="submit" loading={updateTeamMutation.isPending} disabled={editTeamName.trim().length < 3}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        open={Boolean(teamToDelete)}
        title="Delete Team"
        onClose={() => setTeamToDelete(null)}
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{teamToDelete?.name}</span>? This
            action cannot be undone.
          </p>

          {deleteTeamMutation.error ? <p className="text-sm text-red-600">{deleteTeamMutation.error.message}</p> : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setTeamToDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteTeamMutation.isPending}
              onClick={() => {
                if (!teamToDelete) {
                  return
                }
                deleteTeamMutation.mutate(teamToDelete.id)
              }}
            >
              Delete Team
            </Button>
          </div>
        </div>
      </Modal>

      <section className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {teamsQuery.isLoading ? (
          <Card title="Teams">
            <p className="text-sm text-gray-500">Loading teams...</p>
          </Card>
        ) : (teamsQuery.data ?? []).length ? (
          (teamsQuery.data ?? []).map((team) => (
            <article
              key={team.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/teams/${team.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/teams/${team.id}`)
                }
              }}
              className="group h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer hover:shadow-xl"
            >
              <h3 className="text-base font-semibold text-gray-900">{team.name}</h3>
              {team.description ? <p className="mt-1 line-clamp-2 text-xs text-gray-500">{team.description}</p> : null}

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                  <p className="text-[11px] uppercase tracking-wide">Members</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{team.memberCount}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                  <p className="text-[11px] uppercase tracking-wide">Tasks</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{team.taskCount}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                  <p className="text-[11px] uppercase tracking-wide">Done</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{team.completionPercentage}%</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Completion</span>
                  <span className="font-medium text-gray-700">{team.completionPercentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, team.completionPercentage))}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                  <Users className="h-4 w-4" />
                  Open workspace
                </div>
                {canCreateTeam ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit team"
                      onClick={(event) => {
                        event.stopPropagation()
                        openEditModal(team)
                      }}
                      className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete team"
                      onClick={(event) => {
                        event.stopPropagation()
                        setTeamToDelete(team)
                      }}
                      className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <Card title="Teams">
            <p className="text-sm text-gray-500">No teams available.</p>
          </Card>
        )}
      </section>
    </div>
  )
}
