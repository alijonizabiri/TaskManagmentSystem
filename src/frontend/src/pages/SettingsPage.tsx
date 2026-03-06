import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'

export const SettingsPage = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-500">Workspace</p>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </header>

      <Card title="Profile" subtitle="Account and workspace preferences">
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Name:</span> {user?.fullName ?? '-'}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {user?.email ?? '-'}
          </p>
        </div>
      </Card>
    </div>
  )
}