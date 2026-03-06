import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
  hideHeader?: boolean
}

export const Modal = ({ open, title, onClose, children, className, hideHeader = false }: ModalProps) => {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
      <div className={cn('w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl', className)}>
        {hideHeader ? null : (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button className="rounded-md p-1 text-gray-500 hover:bg-gray-100" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
