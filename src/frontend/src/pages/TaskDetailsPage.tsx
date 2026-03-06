import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Paperclip, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { taskService } from '@/services/taskService'
import { teamService } from '@/services/teamService'
import { useAuth } from '@/hooks/useAuth'
import type { TaskAttachment, TaskComment, TaskStatus } from '@/types/task'
import { taskPriorityColor, taskPriorityLabel, taskStatusLabel } from '@/utils/task'
import { canManageTeams } from '@/utils/rbac'
import { formatDateTime, timeAgo } from '@/utils/format'

export const TaskDetailsPage = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const canAssignTask = canManageTeams(role)

  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<TaskComment[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId!),
    enabled: Boolean(taskId)
  })

  const membersQuery = useQuery({
    queryKey: ['team-members', taskQuery.data?.teamId],
    queryFn: () => teamService.getTeamMembers(taskQuery.data!.teamId),
    enabled: Boolean(taskQuery.data?.teamId)
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: TaskStatus) => taskService.updateTaskStatus(taskId!, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string) => taskService.assignTask(taskId!, { assigneeId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const defaultComments = useMemo<TaskComment[]>(
    () => [
      {
        id: 'seed-1',
        author: 'System',
        content: 'Task created and added to active sprint.',
        createdAt: taskQuery.data?.createdAt ?? new Date().toISOString()
      }
    ],
    [taskQuery.data?.createdAt]
  )

  const allComments = comments.length ? [...defaultComments, ...comments] : defaultComments

  if (taskQuery.isLoading) {
    return <p className="text-sm text-gray-500">Loading task details...</p>
  }

  if (!taskQuery.data) {
    return (
      <Card title="Task Details">
        <p className="text-sm text-gray-500">Task not found.</p>
      </Card>
    )
  }

  const task = taskQuery.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/kanban" className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm text-gray-500">Task Details</p>
            <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
          </div>
        </div>
        <Badge color={taskPriorityColor[task.priority]}>{taskPriorityLabel[task.priority]}</Badge>
      </div>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="Description">
            <p className="whitespace-pre-wrap text-sm text-gray-700">{task.description || 'No description provided.'}</p>
          </Card>

          <Card title="Comments" subtitle="Discussion threads (phase 2 API ready)">
            <div className="space-y-3">
              {allComments.map((comment) => (
                <article key={comment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{comment.author}</span>
                    <span>{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                </article>
              ))}
            </div>

            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!newComment.trim()) {
                  return
                }

                setComments((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    author: 'You',
                    content: newComment,
                    createdAt: new Date().toISOString()
                  }
                ])
                setNewComment('')
              }}
            >
              <Input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Add a comment" />
              <Button type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>

          <Card title="Attachments" subtitle="File APIs are planned for phase 2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
              <Paperclip className="h-4 w-4" />
              Upload file
              <input
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    return
                  }

                  setAttachments((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      fileName: file.name,
                      size: `${Math.max(1, Math.round(file.size / 1024))} KB`
                    }
                  ])
                }}
              />
            </label>
            <div className="mt-4 space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <p className="font-medium text-gray-700">{attachment.fileName}</p>
                  <p className="text-xs text-gray-500">{attachment.size}</p>
                </div>
              ))}
              {attachments.length === 0 ? <p className="text-sm text-gray-500">No attachments uploaded.</p> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Metadata">
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-semibold text-gray-700">Status:</span> {taskStatusLabel[task.status]}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Priority:</span> {taskPriorityLabel[task.priority]}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Created By:</span> {task.createdByName}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Created At:</span> {formatDateTime(task.createdAt)}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Deadline:</span> {formatDateTime(task.deadline)}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Assignee:</span> {task.assigneeName ?? 'Unassigned'}
              </p>
            </div>
          </Card>

          <Card title="Actions">
            <div className="space-y-3">
              <Select
                label="Update Status"
                defaultValue={String(task.status)}
                onChange={(event) => updateStatusMutation.mutate(Number(event.target.value) as TaskStatus)}
              >
                {Object.keys(taskStatusLabel).map((status) => (
                  <option key={status} value={status}>
                    {taskStatusLabel[Number(status) as TaskStatus]}
                  </option>
                ))}
              </Select>

              {canAssignTask ? (
                <Select
                  label="Assign Task"
                  defaultValue={task.assigneeId ?? ''}
                  onChange={(event) => {
                    if (event.target.value) {
                      assignMutation.mutate(event.target.value)
                    }
                  }}
                >
                  <option value="">Unassigned</option>
                  {(membersQuery.data ?? []).map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName}
                    </option>
                  ))}
                </Select>
              ) : null}
            </div>

            {updateStatusMutation.error ? <p className="mt-2 text-sm text-red-600">{updateStatusMutation.error.message}</p> : null}
            {assignMutation.error ? <p className="mt-2 text-sm text-red-600">{assignMutation.error.message}</p> : null}
          </Card>
        </div>
      </section>
    </div>
  )
}
