import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFilters } from '../context/FilterContext'
import type { SortKey } from '../context/FilterContext'
import type { Task } from '../types'
import { PRIORITY_ORDER } from '../types'

// The search box and the responsável filter live in the shared Header, so they
// apply to whichever view is open. Filtering used to be implemented inside
// ListView only, which left the Kanban silently ignoring both.

export function matchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    task.titulo.toLowerCase().includes(q) ||
    task.descricao.toLowerCase().includes(q) ||
    task.responsavel.toLowerCase().includes(q) ||
    task.etiquetas.some(e => e.toLowerCase().includes(q))
  )
}

export function sortTasks(tasks: Task[], sortBy: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    if (sortBy === 'prioridade') return PRIORITY_ORDER[b.prioridade] - PRIORITY_ORDER[a.prioridade]
    if (sortBy === 'prazo') {
      // Tasks with no deadline sort last regardless of direction.
      if (!a.prazo && !b.prazo) return 0
      if (!a.prazo) return 1
      if (!b.prazo) return -1
      return a.prazo.localeCompare(b.prazo)
    }
    return b.criado_em.localeCompare(a.criado_em)
  })
}

export interface FilterOptions {
  /** The Kanban shows status as columns, so it must not filter by status. */
  applyStatusFilter?: boolean
  /** The Kanban keeps insertion order inside each column. */
  applySort?: boolean
}

export function useFilteredTasks({
  applyStatusFilter = true,
  applySort = true,
}: FilterOptions = {}) {
  const { tasks } = useApp()
  const { search, filterStatus, filterResponsavel, sortBy } = useFilters()

  return useMemo(() => {
    let list = tasks.filter(t => matchesSearch(t, search))
    if (applyStatusFilter && filterStatus) list = list.filter(t => t.status === filterStatus)
    if (filterResponsavel) list = list.filter(t => t.responsavel === filterResponsavel)
    return applySort ? sortTasks(list, sortBy) : list
  }, [tasks, search, filterStatus, filterResponsavel, sortBy, applyStatusFilter, applySort])
}

export function useResponsaveis(): string[] {
  const { tasks } = useApp()
  return useMemo(
    () => [...new Set(tasks.map(t => t.responsavel).filter(Boolean))].sort(),
    [tasks],
  )
}
