import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CircleDot, Ellipsis, UserCircle2, Users2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { TaskItem, TaskStatus, UpdateTaskRequest } from '@/types/task'
import { Role, type TeamMember } from '@/types/team'
import { formatDate, timeAgo } from '@/utils/format'
import { taskPriorityColor, taskPriorityLabel } from '@/utils/task'

type TaskCardProps = {
  task: TaskItem
  onOpen: (taskId: string) => void
  onQuickUpdate?: (taskId: string, payload: UpdateTaskRequest) => void
  members?: TeamMember[]
  canManageFields?: boolean
}

const statusItems: Array<{ value: TaskStatus; label: string; dotClass: string }> = [
  { value: 2 as TaskStatus, label: 'Backlog', dotClass: 'text-gray-400' },
  { value: 0 as TaskStatus, label: 'Todo', dotClass: 'text-slate-500' },
  { value: 1 as TaskStatus, label: 'In Progress', dotClass: 'text-amber-500' },
  { value: 3 as TaskStatus, label: 'Done', dotClass: 'text-green-500' }
]

const toDateInputValue = (value?: string | null) => {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

const toDeadlineIso = (value: string) => {
  if (!value) return null
  return new Date(`${value}T23:59:00`).toISOString()
}

const statusLabel = (status: TaskStatus) => statusItems.find((x) => x.value === status)?.label ?? 'Todo'
const statusDotClass = (status: TaskStatus) => statusItems.find((x) => x.value === status)?.dotClass ?? 'text-slate-500'

export const TaskCard = ({ task, onOpen, onQuickUpdate, members = [], canManageFields = false }: TaskCardProps) => {
  const [statusOpen, setStatusOpen] = useState(false)
  const [dueOpen, setDueOpen] = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')

  const statusRef = useRef<HTMLDivElement | null>(null)
  const dueRef = useRef<HTMLDivElement | null>(null)
  const assigneeRef = useRef<HTMLDivElement | null>(null)

  const assignableMembers = useMemo(
    () => members.filter((member) => member.role !== Role.Admin),
    [members]
  )

  const filteredAssignees = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase()
    if (!q) {
      return assignableMembers
    }

    return assignableMembers.filter(
      (m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    )
  }, [assigneeSearch, assignableMembers])

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (statusRef.current && !statusRef.current.contains(target)) {
        setStatusOpen(false)
      }
      if (dueRef.current && !dueRef.current.contains(target)) {
        setDueOpen(false)
      }
      if (assigneeRef.current && !assigneeRef.current.contains(target)) {
        setAssigneeOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <article
      onClick={() => onOpen(task.id)}
      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-card"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge color={taskPriorityColor[task.priority]}>{taskPriorityLabel[task.priority]}</Badge>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{timeAgo(task.createdAt)}</span>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-50"
          >
            <Ellipsis className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h4 className="line-clamp-2 text-sm font-semibold text-gray-900">{task.title}</h4>
      {task.description ? <p className="mt-1 line-clamp-2 text-xs text-gray-500">{task.description}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <div ref={statusRef} className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setStatusOpen((prev) => !prev)
              setDueOpen(false)
              setAssigneeOpen(false)
            }}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 text-gray-700 hover:bg-gray-50"
          >
            <CircleDot className={`h-3.5 w-3.5 ${statusDotClass(task.status)}`} />
            <span>{statusLabel(task.status)}</span>
          </button>

          {statusOpen ? (
            <div
              className="absolute left-0 top-8 z-20 min-w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              {statusItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onQuickUpdate?.(task.id, { status: item.value })
                    setStatusOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
                    item.value === task.status ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CircleDot className={`h-3.5 w-3.5 ${item.dotClass}`} />
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div ref={dueRef} className="relative">
          <button
            type="button"
            disabled={!canManageFields}
            onClick={(event) => {
              event.stopPropagation()
              if (!canManageFields) return
              setDueOpen((prev) => !prev)
              setStatusOpen(false)
              setAssigneeOpen(false)
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>

          {dueOpen ? (
            <div
              className="absolute left-0 top-8 z-20 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="date"
                value={toDateInputValue(task.deadline)}
                onChange={(event) => {
                  const value = event.target.value
                  if (!value) {
                    onQuickUpdate?.(task.id, { clearDeadline: true })
                    return
                  }

                  const deadline = toDeadlineIso(value)
                  if (deadline) {
                    onQuickUpdate?.(task.id, { deadline, clearDeadline: false })
                  }
                }}
                className="h-9 w-full rounded-md border border-gray-300 px-2 text-xs"
              />
            </div>
          ) : null}
        </div>

        <div ref={assigneeRef} className="relative">
          <button
            type="button"
            disabled={!canManageFields}
            onClick={(event) => {
              event.stopPropagation()
              if (!canManageFields) return
              setAssigneeOpen((prev) => !prev)
              setStatusOpen(false)
              setDueOpen(false)
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <Users2 className="h-3.5 w-3.5" />
          </button>

          {assigneeOpen ? (
            <div
              className="absolute left-0 top-8 z-20 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                value={assigneeSearch}
                onChange={(event) => setAssigneeSearch(event.target.value)}
                placeholder="Search user"
                className="h-9 w-full rounded-md border border-gray-300 px-2 text-xs"
              />
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onQuickUpdate?.(task.id, { clearAssignee: true })
                    setAssigneeOpen(false)
                  }}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  Unassigned
                </button>
                {filteredAssignees.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => {
                      onQuickUpdate?.(task.id, { assigneeId: member.userId, clearAssignee: false })
                      setAssigneeOpen(false)
                    }}
                    className="w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {member.fullName}
                  </button>
                ))}
                {filteredAssignees.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-gray-500">No users found.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <UserCircle2 className="h-3.5 w-3.5" />
          {task.assigneeName ?? 'Unassigned'}
        </span>
        <span>{formatDate(task.deadline)}</span>
      </div>
    </article>
  )
}
