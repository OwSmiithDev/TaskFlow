import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { useApp } from '../context/AppContext'
import type { Task } from '../types'
import { TAG_COLORS, getColStyle } from '../types'
import { resolveDoneColumn, resolveOpenColumn } from '../utils/columns'
import { Avatar } from './Avatar'
import { DueDateLabel } from './DueDateLabel'
import { PriorityBadge } from './PriorityBadge'

interface Props {
  task: Task
}

function TaskRowBase({ task }: Props) {
  const { updateTask, setViewingTask, setEditingTask, setDeletingTaskId, columns, tags } = useApp()
  // The pipeline is user-editable, so "done" has to be resolved, never assumed.
  const doneCol = resolveDoneColumn(columns)
  const isDone = doneCol !== null && task.status === doneCol.id
  const col = columns.find(c => c.id === task.status) ?? columns[0]
  const colStyle = getColStyle(col)

  function getTagChipClass(name: string) {
    const tag = tags.find(t => t.name === name)
    return tag ? TAG_COLORS[tag.color].chipClass : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => setViewingTask(task)}
      className="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800
                 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer
                 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all"
    >
      {/* Done checkbox */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        onClick={e => {
          e.stopPropagation()
          const target = isDone ? resolveOpenColumn(columns) : doneCol
          if (!target) return
          updateTask(task.id, { status: target.id })
        }}
        aria-label={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                    ${isDone
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
      >
        <AnimatePresence mode="wait">
          {isDone && (
            <motion.svg
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              viewBox="0 0 10 8"
              fill="none"
              className="w-2.5 h-2.5"
            >
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
        }`}>
          {task.titulo}
        </p>
        {task.descricao && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{task.descricao}</p>
        )}
      </div>

      {/* Tags */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0">
        {task.etiquetas.slice(0, 2).map(tag => (
          <span key={tag} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getTagChipClass(tag)}`}>
            {tag}
          </span>
        ))}
      </div>

      {/* Status chip */}
      <div className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${colStyle.headerClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colStyle.dotClass}`} />
        {col.rotulo}
      </div>

      {/* Priority */}
      <div className="hidden sm:block shrink-0">
        <PriorityBadge priority={task.prioridade} size="sm" />
      </div>

      {/* Responsável */}
      {task.responsavel && (
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <Avatar name={task.responsavel} size="sm" />
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
            {task.responsavel.split(' ')[0]}
          </span>
        </div>
      )}

      {/* Due date */}
      {task.prazo && (
        <div className="hidden sm:block shrink-0">
          <DueDateLabel prazo={task.prazo} size="sm" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          onClick={e => { e.stopPropagation(); setEditingTask(task) }}
          aria-label="Editar tarefa"
          className="p-1.5 pointer-coarse:p-2.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
                     hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <Pencil size={14} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          onClick={e => { e.stopPropagation(); setDeletingTaskId(task.id) }}
          aria-label="Excluir tarefa"
          className="p-1.5 pointer-coarse:p-2.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400
                     hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 size={14} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export const TaskRow = memo(TaskRowBase)
