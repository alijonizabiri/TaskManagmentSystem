import { Role } from '@/types/team'

export const roleLabelMap: Record<Role, string> = {
  [Role.Admin]: 'Admin',
  [Role.TeamLead]: 'Team Lead',
  [Role.User]: 'User'
}
