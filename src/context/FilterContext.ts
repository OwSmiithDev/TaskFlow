import { createContext, useContext } from 'react'
import type { Status } from '../types'

export type SortKey = 'prazo' | 'prioridade' | 'criado_em'

export interface FilterContextValue {
  search: string
  setSearch: (s: string) => void
  filterStatus: Status | ''
  setFilterStatus: (s: Status | '') => void
  filterResponsavel: string
  setFilterResponsavel: (r: string) => void
  sortBy: SortKey
  setSortBy: (s: SortKey) => void
}

export const FilterContext = createContext<FilterContextValue | null>(null)

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider')
  return ctx
}
