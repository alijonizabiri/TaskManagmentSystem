import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accentClass?: string
}

export const StatCard = ({ title, value, hint, icon: Icon, accentClass = 'text-brand-primary' }: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <Icon className={`h-5 w-5 ${accentClass}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}
