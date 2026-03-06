import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
}

export const Select = ({ label, className, children, ...props }: SelectProps) => {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-gray-700">
      {label ? <span>{label}</span> : null}
      <select
        className={cn(
          'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none ring-brand-primary transition focus:border-brand-primary focus:ring-2',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
