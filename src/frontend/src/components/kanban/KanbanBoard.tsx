import { useEffect, useMemo, useState } from 'react'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import type { TaskItem } from '@/types/task'
import { boardColumns, columnToStatus, getBoardColumnId, type BoardColumnId } from '@/utils/task'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { SortableTaskCard } from '@/components/kanban/SortableTaskCard'
import { TaskCard } from '@/components/tasks/TaskCard'

type KanbanBoardProps = {
  tasks: TaskItem[]
  onOpenTask: (taskId: string) => void
  onMoveTask: (task: TaskItem, targetColumn: BoardColumnId) => void
}

const isColumnId = (value: string): value is BoardColumnId => {
  return ['backlog', 'todo', 'inprogress', 'done'].includes(value)
}

export const KanbanBoard = ({ tasks, onOpenTask, onMoveTask }: KanbanBoardProps) => {
  const [boardTasks, setBoardTasks] = useState<TaskItem[]>(tasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  useEffect(() => {
    setBoardTasks(tasks)
  }, [tasks])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const grouped = useMemo(() => {
    return boardColumns.reduce<Record<BoardColumnId, TaskItem[]>>(
      (accumulator, column) => {
        accumulator[column.id] = boardTasks.filter((task) => getBoardColumnId(task) === column.id)
        return accumulator
      },
      {
        backlog: [],
        todo: [],
        inprogress: [],
        done: []
      }
    )
  }, [boardTasks])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null

    setActiveTaskId(null)

    if (!overId) {
      return
    }

    const movedTask = boardTasks.find((task) => task.id === activeId)
    if (!movedTask) {
      return
    }

    let destinationColumn: BoardColumnId

    if (isColumnId(overId)) {
      destinationColumn = overId
    } else {
      const destinationTask = boardTasks.find((task) => task.id === overId)
      if (!destinationTask) {
        return
      }
      destinationColumn = getBoardColumnId(destinationTask)
    }

    const sourceColumn = getBoardColumnId(movedTask)
    if (sourceColumn === destinationColumn) {
      return
    }

    const updatedTask: TaskItem = {
      ...movedTask,
      status: columnToStatus(destinationColumn)
    }

    setBoardTasks((prev) => prev.map((task) => (task.id === activeId ? updatedTask : task)))
    onMoveTask(updatedTask, destinationColumn)
  }

  const activeTask = activeTaskId ? boardTasks.find((task) => task.id === activeTaskId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTaskId(null)}
    >
      <div className="grid gap-4 lg:grid-cols-4">
        {boardColumns.map((column) => (
          <KanbanColumn key={column.id} id={column.id} title={column.title} tasks={grouped[column.id]}>
            {(task) => <SortableTaskCard task={task} onOpenTask={onOpenTask} />}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[340px]">
            <TaskCard task={activeTask} onOpen={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
