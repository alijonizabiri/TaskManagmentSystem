import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { teamService } from '@/services/teamService'
import { taskService } from '@/services/taskService'
import { TaskPriority } from '@/types/task'
import { taskPriorityLabel } from '@/utils/task'

type CreateTaskModalProps = {
  open: boolean
  teamId: string
  onClose: () => void
}

const defaultForm = {
  title: '',
  description: '',
  priority: TaskPriority.Medium,
  deadline: '',
  assigneeId: ''
}

export const CreateTaskModal = ({ open, teamId, onClose }: CreateTaskModalProps) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(defaultForm)

  const { data: members = [] } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamService.getTeamMembers(teamId),
    enabled: open && Boolean(teamId)
  })

  const createTaskMutation = useMutation({
    mutationFn: () =>
      taskService.createTask({
        title: form.title,
        description: form.description,
        priority: Number(form.priority),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        assigneeId: form.assigneeId || undefined,
        teamId
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks', teamId] })
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setForm(defaultForm)
      onClose()
    }
  })

  const canSubmit = useMemo(() => form.title.trim().length > 2 && Boolean(teamId), [form.title, teamId])

  return (
    <Modal open={open} title="Create Task" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          createTaskMutation.mutate()
        }}
      >
        <Input
          label="Title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Implement dashboard filters"
          required
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Description
          <textarea
            className="min-h-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-brand-primary transition focus:border-brand-primary focus:ring-2"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Task details and acceptance criteria"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Priority"
            value={String(form.priority)}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: Number(event.target.value) as TaskPriority }))}
          >
            {Object.values(TaskPriority)
              .filter((value): value is TaskPriority => typeof value === 'number')
              .map((value) => (
                <option key={value} value={value}>
                  {taskPriorityLabel[value]}
                </option>
              ))}
          </Select>

          <Input
            type="datetime-local"
            label="Deadline"
            value={form.deadline}
            onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
          />
        </div>

        <Select
          label="Assignee"
          value={form.assigneeId}
          onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName} ({member.email})
            </option>
          ))}
        </Select>

        {createTaskMutation.error ? (
          <p className="text-sm text-red-600">{createTaskMutation.error.message}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createTaskMutation.isPending} disabled={!canSubmit}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  )
}
