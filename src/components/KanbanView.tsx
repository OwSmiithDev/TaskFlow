import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useFilteredTasks } from '../hooks/useFilteredTasks'
import type { Task } from '../types'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

const columnVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
}

export function KanbanView() {
  const { tasks, columns, reorderTasks, showToast } = useApp()
  // Status is expressed by the columns themselves, and each column keeps its
  // own insertion order, so those two filters are skipped here.
  const visibleTasks = useFilteredTasks({ applyStatusFilter: false, applySort: false })
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const dragOriginStatus = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 10 } }),
  )

  function onDragStart({ active }: DragStartEvent) {
    const task = tasks.find(t => t.id === active.id) ?? null
    dragOriginStatus.current = task?.status ?? null
    setActiveTask(task)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return
    const overIsColumn = columns.some(c => c.id === over.id)
    const targetStatus = overIsColumn
      ? (over.id as string)
      : (tasks.find(t => t.id === over.id)?.status ?? null)
    if (!targetStatus || activeTask.status === targetStatus) return
    reorderTasks(tasks.map(t => (t.id === activeTask.id ? { ...t, status: targetStatus } : t)))
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const startedIn = dragOriginStatus.current
    dragOriginStatus.current = null
    setActiveTask(null)
    if (!over || active.id === over.id) return
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return

    const overIsColumn = columns.some(c => c.id === over.id)
    if (!overIsColumn) {
      const overTask = tasks.find(t => t.id === over.id)
      if (!overTask || activeTask.status !== overTask.status) return
      const colTasks = tasks.filter(t => t.status === activeTask.status)
      const oldIdx = colTasks.findIndex(t => t.id === active.id)
      const newIdx = colTasks.findIndex(t => t.id === over.id)
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(colTasks, oldIdx, newIdx)
        // Keep the untouched tasks in place instead of appending the whole
        // column at the end of the list.
        const others = tasks.filter(t => t.status !== activeTask.status)
        const firstIdx = tasks.findIndex(t => t.status === activeTask.status)
        const head = others.filter(t => tasks.indexOf(t) < firstIdx)
        const tail = others.filter(t => tasks.indexOf(t) > firstIdx)
        reorderTasks([...head, ...reordered, ...tail])
      }
    }

    // Only announce a move that actually changed column.
    if (startedIn && startedIn !== activeTask.status) {
      const col = columns.find(c => c.id === activeTask.status)
      if (col) showToast(`Movido para "${col.rotulo}"`, 'info')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="overflow-x-auto w-full">
        <motion.div
          className="flex gap-3 sm:gap-4 min-w-max px-3 sm:px-4 pb-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {columns.map(col => (
            <motion.div key={col.id} variants={columnVariants}>
              <KanbanColumn
                column={col}
                tasks={visibleTasks.filter(t => t.status === col.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeTask && <TaskCard task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
