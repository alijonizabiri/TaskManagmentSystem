import { cn } from '@/utils/cn'

type CardProps = {
  title?: string
  subtitle?: string
  className?: string
  children: React.ReactNode
}

export const Card = ({ title, subtitle, className, children }: CardProps) => {
  return (
    <section className={cn('rounded-2xl border border-gray-200 bg-white p-5 shadow-card', className)}>
      {title ? <h3 className="text-base font-semibold text-brand-text">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      <div className={cn(title || subtitle ? 'mt-4' : '')}>{children}</div>
    </section>
  )
}
