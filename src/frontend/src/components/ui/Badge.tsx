import { cn } from '@/utils/cn'

type BadgeProps = {
  children: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'info' | 'gray'
}

const colorMap: Record<NonNullable<BadgeProps['color']>, string> = {
  primary: 'bg-indigo-100 text-indigo-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700'
}

export const Badge = ({ children, color = 'gray' }: BadgeProps) => {
  return <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', colorMap[color])}>{children}</span>
}
