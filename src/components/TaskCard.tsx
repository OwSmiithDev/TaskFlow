import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { memo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import type { Task } from '../types'
import { TAG_COLORS } from '../types'
import { Avatar } from './Avatar'
import { DueDateLabel } from './DueDateLabel'
import { PriorityBadge } from './PriorityBadge'

interface Props {
  task: Task
  overlay?: boolean
}

function TaskCardBase({ task, overlay }: Props) {
  const { setViewingTask, setEditingTask, setDeletingTaskId, tags } = useApp()
  const pointerStart = useRef<{ x: number; y: number } | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: overlay,
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  function handlePointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY }
    listeners?.onPointerDown?.(e as never)
  }

  function handleClick(e: React.MouseEvent) {
    if (pointerStart.current) {
      const dx = e.clientX - pointerStart.current.x
      const dy = e.clientY - pointerStart.current.y
      if (Math.hypot(dx, dy) >= 5) return
    }
    setViewingTask(task)
  }

  const { onPointerDown: _dnd, ...restListeners } = (listeners ?? {}) as Record<string, unknown>
  void _dnd

  function getChipClass(name: string) {
    const tag = tags.find(t => t.name === name)
    return tag
      ? TAG_COLORS[tag.color].chipClass
      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...restListeners}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
                  shadow-sm p-3.5 select-none transition-shadow cursor-grab active:cursor-grabbing
                  ${isDragging ? 'opacity-40' : 'hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800'}
                  ${overlay ? 'shadow-xl rotate-1 opacity-95 cursor-grabbing' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <PriorityBadge priority={task.prioridade} size="sm" />
        <GripVertical
          size={14}
          className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors"
        />
      </div>

      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-2 line-clamp-2">
        {task.titulo}
      </p>

      {task.descricao && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {task.descricao}
        </p>
      )}

      {task.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.etiquetas.slice(0, 3).map(tag => (
            <span key={tag} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getChipClass(tag)}`}>
              {tag}
            </span>
          ))}
          {task.etiquetas.length > 3 && (
            <span className="text-[10px] text-gray-400">+{task.etiquetas.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {task.responsavel && <Avatar name={task.responsavel} size="sm" />}
          {task.prazo && <DueDateLabel prazo={task.prazo} size="sm" />}
        </div>

        <div className="flex items-center gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            onClick={e => { e.stopPropagation(); setEditingTask(task) }}
            className="p-1.5 pointer-coarse:p-2.5 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
                       hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            aria-label="Editar tarefa"
          >
            <Pencil size={13} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            onClick={e => { e.stopPropagation(); setDeletingTaskId(task.id) }}
            className="p-1.5 pointer-coarse:p-2.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Excluir tarefa"
          >
            <Trash2 size={13} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export const TaskCard = memo(TaskCardBase)

function AnimatedTaskCardBase({ task }: { task: Task }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -6 }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
      transition={{
        layout: { type: 'spring', stiffness: 350, damping: 30 },
        default: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      <TaskCard task={task} />
    </motion.div>
  )
}

export const AnimatedTaskCard = memo(AnimatedTaskCardBase)
