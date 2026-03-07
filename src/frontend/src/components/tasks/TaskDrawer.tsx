import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, X } from 'lucide-react'
import { taskService } from '@/services/taskService'
import { useAuth } from '@/hooks/useAuth'
import type { TaskPriority, TaskStatus, UpdateTaskRequest } from '@/types/task'
import { Role, type TeamMember } from '@/types/team'
import { formatDateTime } from '@/utils/format'
import { taskPriorityLabel } from '@/utils/task'

type TaskDrawerProps = {
  open: boolean
  taskId: string | null
  teamId: string
  members: TeamMember[]
  onClose: () => void
}

const toDateInputValue = (isoValue?: string | null) => {
  if (!isoValue) {
    return ''
  }

  return new Date(isoValue).toISOString().slice(0, 10)
}

const toDeadlineIso = (dateValue: string) => {
  if (!dateValue) {
    return null
  }

  return new Date(`${dateValue}T23:59:00`).toISOString()
}

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) {
    return '-'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const resolveAttachmentUrl = (url?: string) => {
  if (!url) {
    return ''
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api'
  const normalizedApiBase = String(apiBase).replace(/\/+$/, '')

  if (url.startsWith('/uploads')) {
    return `${normalizedApiBase}${url}`
  }

  return url
}

export const TaskDrawer = ({ open, taskId, teamId, members, onClose }: TaskDrawerProps) => {
  const queryClient = useQueryClient()
  const { canCreateTasks } = useAuth()
  const panelRef = useRef<HTMLDivElement | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(0)
  const [priority, setPriority] = useState<TaskPriority>(1)
  const [deadline, setDeadline] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const syncedRef = useRef({ title: '', description: '' })

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId!),
    enabled: open && Boolean(taskId),
    staleTime: 0,
    refetchOnMount: 'always'
  })

  useEffect(() => {
    if (!taskQuery.data) {
      return
    }

    setTitle(taskQuery.data.title)
    setDescription(taskQuery.data.description ?? '')
    setStatus(taskQuery.data.status)
    setPriority(taskQuery.data.priority)
    setDeadline(toDateInputValue(taskQuery.data.deadline))
    setAssigneeId(taskQuery.data.assigneeId ?? '')
    syncedRef.current = {
      title: taskQuery.data.title,
      description: taskQuery.data.description ?? ''
    }
    setSaveState('idle')
    setUploadError(null)
  }, [taskQuery.data])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateTaskRequest) => taskService.updateTask(taskId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['team-tasks', teamId] })
      await queryClient.invalidateQueries({ queryKey: ['team-stats', teamId] })
    }
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => taskService.uploadAttachment(taskId!, file),
    onSuccess: async () => {
      setUploadError(null)
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
    onError: (error: Error) => {
      setUploadError(error.message)
    }
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => taskService.deleteAttachment(taskId!, attachmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    }
  })

  useEffect(() => {
    if (!open || !taskId) {
      return
    }

    const handlePaste = (event: ClipboardEvent) => {
      if (!panelRef.current) {
        return
      }

      const target = event.target as Node | null
      if (target && !panelRef.current.contains(target)) {
        return
      }

      const items = Array.from(event.clipboardData?.items ?? [])
      const imageItem = items.find((item) => item.type.startsWith('image/'))
      if (!imageItem) {
        return
      }

      const file = imageItem.getAsFile()
      if (!file) {
        return
      }

      event.preventDefault()
      const extension = file.type.split('/')[1] ?? 'png'
      const pastedFile = new File([file], `pasted-${Date.now()}.${extension}`, { type: file.type })
      uploadMutation.mutate(pastedFile)
    }

    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [open, taskId, uploadMutation])

  useEffect(() => {
    if (!taskQuery.data || !open) {
      return
    }

    const normalizedTitle = title.trim()
    const normalizedDescription = description

    if (normalizedTitle === syncedRef.current.title && normalizedDescription === syncedRef.current.description) {
      return
    }

    if (!normalizedTitle) {
      setSaveState('error')
      return
    }

    setSaveState('saving')

    const timeout = window.setTimeout(() => {
      updateMutation.mutate(
        {
          title: normalizedTitle,
          description: normalizedDescription
        },
        {
          onSuccess: () => {
            syncedRef.current = {
              title: normalizedTitle,
              description: normalizedDescription
            }
            setSaveState('saved')
          },
          onError: () => {
            setSaveState('error')
          }
        }
      )
    }, 650)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [title, description, open, taskQuery.data, updateMutation])

  const savingText = useMemo(() => {
    if (saveState === 'saving') {
      return 'Saving...'
    }

    if (saveState === 'saved') {
      return 'Saved'
    }

    if (saveState === 'error') {
      return 'Save failed'
    }

    return ''
  }, [saveState])

  if (!open || !taskId) {
    return null
  }

  const task = taskQuery.data
  const attachments = task?.attachments ?? []

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-gray-900/30">
      <button type="button" aria-label="Close drawer" className="absolute inset-0 h-full w-full" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-white shadow-2xl" ref={panelRef}>
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <p className="text-sm font-semibold text-gray-800">Task Details</p>
            <div className="flex items-center gap-3">
              {savingText ? <span className="text-xs font-medium text-gray-500">{savingText}</span> : null}
              <button
                type="button"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {taskQuery.isLoading ? (
            <div className="p-5 text-sm text-gray-500">Loading task...</div>
          ) : task ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-400">TASK</p>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full border-none p-0 text-3xl font-semibold text-gray-900 outline-none"
                  placeholder="Task title"
                />
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-24 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-300"
                  placeholder="Click to add description"
                />
                {saveState === 'error' ? <p className="text-xs text-red-600">Title is required to save changes.</p> : null}
              </div>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                    <select
                      value={status}
                      onChange={(event) => {
                        const value = Number(event.target.value) as TaskStatus
                        setStatus(value)
                        updateMutation.mutate({ status: value })
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                    >
                      <option value="0">Todo</option>
                      <option value="1">In Progress</option>
                      <option value="2">Backlog</option>
                      <option value="3">Done</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Priority
                    <select
                      value={priority}
                      disabled={!canCreateTasks}
                      onChange={(event) => {
                        const value = Number(event.target.value) as TaskPriority
                        setPriority(value)
                        updateMutation.mutate({ priority: value })
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="0">{taskPriorityLabel[0 as TaskPriority]}</option>
                      <option value="1">{taskPriorityLabel[1 as TaskPriority]}</option>
                      <option value="2">{taskPriorityLabel[2 as TaskPriority]}</option>
                      <option value="3">{taskPriorityLabel[3 as TaskPriority]}</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Due date
                    <input
                      type="date"
                      value={deadline}
                      disabled={!canCreateTasks}
                      onChange={(event) => {
                        const value = event.target.value
                        setDeadline(value)
                        if (!value) {
                          updateMutation.mutate({ clearDeadline: true })
                          return
                        }

                        const isoValue = toDeadlineIso(value)
                        if (isoValue) {
                          updateMutation.mutate({ deadline: isoValue, clearDeadline: false })
                        }
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Assignee
                    <select
                      value={assigneeId}
                      disabled={!canCreateTasks}
                      onChange={(event) => {
                        const value = event.target.value
                        setAssigneeId(value)

                        if (!value) {
                          updateMutation.mutate({ clearAssignee: true })
                          return
                        }

                        updateMutation.mutate({ assigneeId: value, clearAssignee: false })
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">Unassigned</option>
                      {members
                        .filter((member) => member.role !== Role.Admin)
                        .map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.fullName}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  <p>Created by {task.createdByName}</p>
                  <p>Created at {formatDateTime(task.createdAt)}</p>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Attachments</h3>
                    <p className="text-xs text-gray-500">Press Ctrl+V to paste screenshot directly.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Paperclip className="h-4 w-4" />
                    Attach file
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) {
                          return
                        }

                        uploadMutation.mutate(file)
                        event.target.value = ''
                      }}
                    />
                  </label>
                </div>

                {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}

                <div className="mt-3 space-y-2">
                  {attachments.map((attachment) => {
                    const isImage = (attachment.contentType ?? '').startsWith('image/')
                    const rawAttachmentUrl = attachment.url ?? ''
                    const attachmentUrl = resolveAttachmentUrl(rawAttachmentUrl)

                    return (
                      <div key={attachment.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-sm font-medium text-indigo-600 hover:underline"
                            >
                              {attachment.fileName}
                            </a>
                            <p className="text-xs text-gray-500">
                              {formatBytes(attachment.sizeBytes)} - {attachment.uploadedByName} - {formatDateTime(attachment.createdAt)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                          >
                            Delete
                          </button>
                        </div>
                        {isImage && attachmentUrl ? (
                          <a href={attachmentUrl} target="_blank" rel="noreferrer">
                            <img
                              src={attachmentUrl}
                              alt={attachment.fileName}
                              className="mt-2 max-h-52 w-auto rounded-lg border border-gray-200 object-contain"
                            />
                          </a>
                        ) : null}
                      </div>
                    )
                  })}
                  {attachments.length === 0 ? <p className="text-sm text-gray-500">No attachments yet.</p> : null}
                </div>
              </section>

              {updateMutation.error ? <p className="text-xs text-red-600">{updateMutation.error.message}</p> : null}
              {deleteAttachmentMutation.error ? <p className="text-xs text-red-600">{deleteAttachmentMutation.error.message}</p> : null}
            </div>
          ) : (
            <div className="p-5 text-sm text-gray-500">Task not found.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
