export enum Role {
  Admin = 0,
  TeamLead = 1,
  User = 2
}

export type Team = {
  id: string
  name: string
  memberCount: number
  createdAt: string
}

export type TeamMember = {
  userId: string
  fullName: string
  email: string
  role: Role
}

export type CreateTeamRequest = {
  name: string
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
