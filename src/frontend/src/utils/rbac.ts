import { Role } from '@/types/team'

export const hasRequiredRole = (role: Role | undefined, allowedRoles: Role[]) => {
  if (role === undefined) {
    return false
  }

  return allowedRoles.includes(role)
}

export const canAccessAdminPages = (role: Role | undefined) => role === Role.Admin

export const canManageTeams = (role: Role | undefined) => role === Role.Admin || role === Role.TeamLead

export const canInviteUsers = (role: Role | undefined) => role === Role.Admin || role === Role.TeamLead

// Product requirement: only TeamLead sees task creation actions.
export const canCreateTasks = (role: Role | undefined) => role === Role.TeamLead

export const canAccessTeamWorkspace = (role: Role | undefined) =>
  role === Role.Admin || role === Role.TeamLead || role === Role.User

export const canAccessMyTasks = (role: Role | undefined) => role === Role.User