import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-gray-700">
      {label ? <span>{label}</span> : null}
      <input
        className={cn(
          'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none ring-brand-primary transition focus:border-brand-primary focus:ring-2',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : '',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
