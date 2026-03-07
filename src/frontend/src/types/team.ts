export enum Role {
  Admin = 0,
  TeamLead = 1,
  User = 2
}

export type Team = {
  id: string
  name: string
  description?: string | null
  teamLeadUserId?: string | null
  teamLeadName?: string | null
  memberCount: number
  taskCount: number
  completedTaskCount: number
  completionPercentage: number
  createdAt: string
}

export type TeamDetail = {
  id: string
  name: string
  description?: string | null
  teamLeadUserId?: string | null
  teamLeadName?: string | null
  memberCount: number
  taskCount: number
  completedTaskCount: number
  completionPercentage: number
  createdAt: string
}

export type TeamStats = {
  teamId: string
  backlog: number
  todo: number
  inProgress: number
  done: number
}

export type TeamMember = {
  userId: string
  fullName: string
  email: string
  role: Role
}

export type CreateTeamRequest = {
  name: string
  description?: string
  teamLeadId?: string
}

export type UpdateTeamRequest = {
  name: string
  description?: string
  teamLeadId?: string
}

export type InviteMemberRequest = {
  email: string
  role: Role
}

export type InviteMemberResponse = {
  message: string
  token: string
}

export type LocalInvite = {
  id: string
  email: string
  role: Role
  token: string
  createdAt: string
}
