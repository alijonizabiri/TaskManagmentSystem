import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}

const styles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-primary text-white hover:bg-indigo-700',
  secondary: 'bg-white text-brand-text border border-gray-200 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-brand-text hover:bg-gray-100'
}

export const Button = ({
  className,
  variant = 'primary',
  disabled,
  loading,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60',
        styles[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  )
}
