import React, { useMemo, useState } from 'react'
import type { Status } from '../types'
import { FilterContext } from './FilterContext'
import type { FilterContextValue, SortKey } from './FilterContext'

/**
 * Filters are deliberately kept out of AppContext.
 *
 * They change on every keystroke in the search box, and a single combined
 * context meant each keystroke produced a new context value — re-rendering
 * every task card on the board even though no card depends on the query.
 * TaskCard/TaskRow subscribe only to AppContext, so typing no longer touches
 * them; only the components that actually read a filter re-render.
 */
export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [filterResponsavel, setFilterResponsavel] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('criado_em')

  const value = useMemo<FilterContextValue>(
    () => ({
      search, setSearch,
      filterStatus, setFilterStatus,
      filterResponsavel, setFilterResponsavel,
      sortBy, setSortBy,
    }),
    [search, filterStatus, filterResponsavel, sortBy],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}
