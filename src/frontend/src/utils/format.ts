import { format, formatDistanceToNow } from 'date-fns'

export const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }

  return format(new Date(value), 'dd MMM yyyy')
}

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-'
  }

  return format(new Date(value), 'dd MMM yyyy, HH:mm')
}

export const timeAgo = (value?: string | null) => {
  if (!value) {
    return 'just now'
  }

  return formatDistanceToNow(new Date(value), { addSuffix: true })
}
