import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ListChecks,
  Pencil,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useModalBehavior } from '../hooks/useModalBehavior'
import { PRIORITY_CONFIG, TAG_COLORS, getColStyle } from '../types'
import type { Subtarefa } from '../types'
import { resolveDoneColumn } from '../utils/columns'
import { isOverdue, todayLocal } from '../utils/dates'
import { Avatar } from './Avatar'
import { SubtarefasSection } from './SubtarefasSection'

type ModalMode = 'view' | 'concluir' | 'pendente'

export function TaskViewModal() {
  const {
    viewingTask,
    setViewingTask,
    setEditingTask,
    setDeletingTaskId,
    columns,
    tags,
    updateTask,
    showToast,
  } = useApp()

  const [mode, setMode] = useState<ModalMode>('view')
  const [solucao, setSolucao] = useState('')
  // Computed per mount, in local time — `toISOString()` yields the UTC date,
  // which in UTC-3 is already tomorrow after 21:00.
  const [dataConclusao, setDataConclusao] = useState(todayLocal)
  const [motivoPendencia, setMotivoPendencia] = useState('')
  const [concluirHighlight, setConcluirHighlight] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const panelRef = useModalBehavior<HTMLDivElement>(() => setViewingTask(null))

  // Scroll form into view when mode changes
  useEffect(() => {
    if (mode !== 'view') {
      const t = setTimeout(
        () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
        80,
      )
      return () => clearTimeout(t)
    }
  }, [mode])

  // Derived from the task instead of copied into state by an effect: the copy
  // caused a second render pass on every open and could drift from the store.
  const subtarefas = useMemo<Subtarefa[]>(
    () => viewingTask?.subtarefas ?? [],
    [viewingTask?.subtarefas],
  )

  // Highlight "Concluído" button when all subtarefas just got completed
  const prevAllDoneRef = useRef(false)
  useEffect(() => {
    if (subtarefas.length === 0) return
    const allDone = subtarefas.every(s => s.concluida)
    if (allDone && !prevAllDoneRef.current) {
      setConcluirHighlight(true)
      const t = setTimeout(() => setConcluirHighlight(false), 800)
      prevAllDoneRef.current = true
      return () => clearTimeout(t)
    }
    if (!allDone) prevAllDoneRef.current = false
  }, [subtarefas])

  if (!viewingTask) return null
  const task = viewingTask

  const hasSubtarefas = subtarefas.length > 0
  const allSubtarefasDone = hasSubtarefas && subtarefas.every(s => s.concluida)
  const concluirDisabled = hasSubtarefas && !allSubtarefasDone
  const pendingCount = subtarefas.filter(s => !s.concluida).length

  function handleSubtarefasChange(updated: Subtarefa[]) {
    updateTask(task.id, { subtarefas: updated })
  }

  const col = columns.find(c => c.id === task.status) ?? columns[0]
  const colStyle = getColStyle(col)
  const priority = PRIORITY_CONFIG[task.prioridade]
  const overdue = task.prazo ? isOverdue(task.prazo) : false

  function getChipClass(name: string) {
    const t = tags.find(t => t.name === name)
    return t
      ? TAG_COLORS[t.color].chipClass
      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
  }

  function formatDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  function formatCreatedAt(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function openEdit() {
    setViewingTask(null)
    setEditingTask(task)
  }
  function openDelete() {
    setViewingTask(null)
    setDeletingTaskId(task.id)
  }

  function saveConcluido() {
    const doneCol = resolveDoneColumn(columns)
    if (!doneCol) return
    updateTask(task.id, {
      status: doneCol.id,
      solucao: solucao.trim() || undefined,
      data_conclusao: dataConclusao || undefined,
      motivo_pendencia: undefined,
    })
    showToast(`Tarefa concluída! Movida para "${doneCol.rotulo}"`)
    setViewingTask(null)
  }

  function savePendente() {
    const pendingCol =
      columns.find(c => c.id === 'pending') ??
      columns.find(c => c.rotulo.toLowerCase().includes('pendente')) ??
      columns.find(c => c.id === 'todo') ??
      columns.find(c => c.rotulo.toLowerCase().includes('fazer')) ??
      columns[0]
    updateTask(task.id, {
      status: pendingCol.id,
      motivo_pendencia: motivoPendencia.trim() || undefined,
      solucao: undefined,
      data_conclusao: undefined,
    })
    showToast(`Tarefa marcada como pendente. Movida para "${pendingCol.rotulo}"`, 'info')
    setViewingTask(null)
  }

  const textareaClass =
    'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ' +
    'rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 ' +
    'placeholder-gray-400 resize-none transition-all'
  const inputClass =
    'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ' +
    'rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 transition-all'
  const sectionLabel =
    'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-modal-title"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setViewingTask(null)}
      />

      {/* Panel — bottom-sheet on mobile, centered dialog on sm+ */}
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl
                   border border-gray-200 dark:border-gray-700
                   w-full sm:max-w-lg max-h-[94dvh] sm:max-h-[88dvh] flex flex-col"
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${colStyle.headerClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colStyle.dotClass}`} />
                {col.rotulo}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priority.badgeClass}`}>
                {priority.label}
              </span>
            </div>
            <h2
              id="view-modal-title"
              className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug"
            >
              {task.titulo}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => setViewingTask(null)}
            aria-label="Fechar"
            className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </motion.button>
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5"
        >
          {/* Description */}
          {task.descricao ? (
            <div>
              <p className={sectionLabel}>Descrição</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {task.descricao}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-600 italic">Sem descrição.</p>
          )}

          {/* Subtarefas */}
          <div>
            <SubtarefasSection subtarefas={subtarefas} onChange={handleSubtarefasChange} />
          </div>

          {/* Responsável + Prazo */}
          {(task.responsavel || task.prazo) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {task.responsavel && (
                <div>
                  <p className={`${sectionLabel} flex items-center gap-1`}>
                    <User size={11} /> Responsável
                  </p>
                  <div className="flex items-center gap-2">
                    <Avatar name={task.responsavel} size="md" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {task.responsavel}
                    </span>
                  </div>
                </div>
              )}
              {task.prazo && (
                <div>
                  <p className={`${sectionLabel} flex items-center gap-1`}>
                    <CalendarClock size={11} /> Prazo
                  </p>
                  <span
                    className={`text-sm font-semibold ${
                      overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {formatDate(task.prazo)}
                    {overdue && (
                      <span className="ml-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                        Vencido
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {task.etiquetas.length > 0 && (
            <div>
              <p className={`${sectionLabel} flex items-center gap-1`}>
                <Tag size={11} /> Etiquetas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.etiquetas.map(tag => (
                  <span
                    key={tag}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${getChipClass(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Existing solution (shown in view mode) */}
          {task.solucao && mode === 'view' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Solução registrada
              </p>
              <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed whitespace-pre-wrap">
                {task.solucao}
              </p>
              {task.data_conclusao && (
                <p className="text-xs text-green-600 dark:text-green-500">
                  Concluído em {formatDate(task.data_conclusao)}
                </p>
              )}
            </div>
          )}

          {/* Existing pending reason (shown in view mode) */}
          {task.motivo_pendencia && mode === 'view' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={12} /> Motivo da pendência
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
                {task.motivo_pendencia}
              </p>
            </div>
          )}

          {/* ─── Status change forms ─────────────────────────────────────── */}
          <AnimatePresence>
            {mode === 'concluir' && (
              <motion.div
                ref={formRef}
                key="form-concluir"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Informações de conclusão
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-green-700 dark:text-green-500 mb-1.5">
                    Descrição da solução
                  </label>
                  <textarea
                    autoFocus
                    value={solucao}
                    onChange={e => setSolucao(e.target.value)}
                    placeholder="Descreva como a tarefa foi resolvida..."
                    rows={4}
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-green-700 dark:text-green-500 mb-1.5">
                    Data de conclusão
                  </label>
                  <input
                    type="date"
                    value={dataConclusao}
                    onChange={e => setDataConclusao(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </motion.div>
            )}

            {mode === 'pendente' && (
              <motion.div
                ref={formRef}
                key="form-pendente"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Por que está pendente?
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-700 dark:text-amber-500 mb-1.5">
                    Motivo / bloqueio
                  </label>
                  <textarea
                    autoFocus
                    value={motivoPendencia}
                    onChange={e => setMotivoPendencia(e.target.value)}
                    placeholder="Descreva o motivo da pendência ou bloqueio..."
                    rows={4}
                    className={textareaClass}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-gray-400 dark:text-gray-600 pt-2 border-t border-gray-100 dark:border-gray-800">
            Criado em {formatCreatedAt(task.criado_em)}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4">
          {mode === 'view' ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* Excluir */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={openDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400
                           hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Excluir</span>
              </motion.button>

              {/* Status buttons + Editar — pushed right */}
              <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={() => setMode('pendente')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                             text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20
                             hover:bg-amber-100 dark:hover:bg-amber-900/40
                             border border-amber-200 dark:border-amber-800
                             rounded-lg transition-colors"
                >
                  <Clock size={14} />
                  Pendente
                </motion.button>

                <div className="relative group/concluir">
                  <motion.button
                    onClick={() => !concluirDisabled && setMode('concluir')}
                    disabled={concluirDisabled}
                    animate={concluirHighlight ? { scale: [1, 1.06, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                               border rounded-lg transition-all
                               ${concluirDisabled
                                 ? 'text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                                 : 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800 cursor-pointer'}`}
                  >
                    <CheckCircle2 size={14} />
                    Concluído
                  </motion.button>
                  {concluirDisabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/concluir:block z-10 pointer-events-none">
                      <div className="bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <ListChecks size={11} className="inline mr-1 -mt-0.5" />
                        Conclua {pendingCount} subtarefa{pendingCount !== 1 ? 's' : ''} primeiro
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-900" />
                      </div>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={openEdit}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white
                             px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Pencil size={14} />
                  <span className="hidden sm:inline">Editar</span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={() => setMode('view')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           rounded-lg transition-colors"
              >
                Cancelar
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: mode === 'concluir' ? '0 4px 14px rgba(22,163,74,0.35)' : '0 4px 14px rgba(217,119,6,0.35)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={mode === 'concluir' ? saveConcluido : savePendente}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm
                           ${mode === 'concluir'
                             ? 'bg-green-600 hover:bg-green-700'
                             : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {mode === 'concluir' ? (
                  <><CheckCircle2 size={15} /> Salvar como Concluído</>
                ) : (
                  <><Clock size={15} /> Salvar como Pendente</>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
