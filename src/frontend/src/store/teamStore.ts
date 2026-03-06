import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type TeamState = {
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      selectedTeamId: null,
      setSelectedTeamId: (id) => set({ selectedTeamId: id })
    }),
    {
      name: 'tms-team'
    }
  )
)
