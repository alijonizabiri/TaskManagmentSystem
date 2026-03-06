import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TopBar } from '@/components/navigation/TopBar'

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-brand-muted/70">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex h-full flex-1 flex-col overflow-hidden md:pl-72">
        <TopBar onOpenSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
