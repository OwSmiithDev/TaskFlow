import { AnimatePresence } from 'framer-motion'
import { ArrowUpDown, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFilters } from '../context/FilterContext'
import { useFilteredTasks, useResponsaveis } from '../hooks/useFilteredTasks'
import type { Status } from '../types'
import { EmptyState } from './EmptyState'
import { TaskRow } from './TaskRow'

export function ListView() {
  const { columns } = useApp()
  const {
    search,
    filterStatus,
    setFilterStatus,
    filterResponsavel,
    setFilterResponsavel,
    sortBy,
    setSortBy,
  } = useFilters()

  const responsaveis = useResponsaveis()
  const filtered = useFilteredTasks()

  const hasFilters = !!(search || filterStatus || filterResponsavel)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Filter size={13} />
          Filtrar:
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as Status | '')}
          className="text-sm py-1.5 px-3 bg-white dark:bg-gray-800 border border-gray-200
                     dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {columns.map(c => (
            <option key={c.id} value={c.id}>{c.rotulo}</option>
          ))}
        </select>

        {responsaveis.length > 0 && (
          <select
            value={filterResponsavel}
            onChange={e => setFilterResponsavel(e.target.value)}
            className="text-sm py-1.5 px-3 bg-white dark:bg-gray-800 border border-gray-200
                       dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por responsável"
          >
            <option value="">Todos os responsáveis</option>
            {responsaveis.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1.5 w-full sm:w-auto sm:ml-auto">
          <ArrowUpDown size={13} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm py-1.5 px-3 bg-white dark:bg-gray-800 border border-gray-200
                       dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Ordenar por"
          >
            <option value="criado_em">Mais recentes</option>
            <option value="prazo">Prazo</option>
            <option value="prioridade">Prioridade</option>
          </select>
        </div>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} {filtered.length === 1 ? 'tarefa' : 'tarefas'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState filtered={hasFilters} />
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {filtered.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
