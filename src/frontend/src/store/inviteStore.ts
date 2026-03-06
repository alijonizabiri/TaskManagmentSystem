import { create } from 'zustand'
import type { LocalInvite } from '@/types/team'

type InviteState = {
  invitesByTeam: Record<string, LocalInvite[]>
  addInvite: (teamId: string, invite: LocalInvite) => void
}

export const useInviteStore = create<InviteState>((set) => ({
  invitesByTeam: {},
  addInvite: (teamId, invite) =>
    set((state) => ({
      invitesByTeam: {
        ...state.invitesByTeam,
        [teamId]: [invite, ...(state.invitesByTeam[teamId] ?? [])]
      }
    }))
}))
