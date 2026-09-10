import { createContext, useContext } from 'react'
import type { KanbanCol, Status, Tag, Task, ViewMode } from '../types'

// Store contract, reducer and hook live in this JSX-free module so that
// AppProvider.tsx exports a component and nothing else — mixing component and
// non-component exports in one file breaks Vite's fast refresh.

// ─── Task reducer ──────────────────────────────────────────────────────────
// Actions that touch every task (tag rename, column removal) must run *inside*
// the reducer. Computing the new array in a callback and dispatching REPLACE
// reads a stale `tasks` snapshot, so a concurrent edit in the same batch is
// silently lost.
export type TaskAction =
  | { type: 'ADD'; task: Task }
  | { type: 'UPDATE'; id: string; updates: Partial<Task> }
  | { type: 'DELETE'; id: string }
  | { type: 'REPLACE'; tasks: Task[] }
  | { type: 'RENAME_TAG'; from: string; to: string }
  | { type: 'REMOVE_TAG'; name: string }
  | { type: 'MOVE_STATUS'; from: Status; to: Status }
  | { type: 'DEDUPE' }

export function taskReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.task]
    case 'UPDATE':
      return state.map(t => (t.id === action.id ? { ...t, ...action.updates } : t))
    case 'DELETE':
      return state.filter(t => t.id !== action.id)
    case 'REPLACE':
      return action.tasks
    case 'RENAME_TAG':
      return state.map(t =>
        t.etiquetas.includes(action.from)
          ? { ...t, etiquetas: t.etiquetas.map(e => (e === action.from ? action.to : e)) }
          : t,
      )
    case 'REMOVE_TAG':
      return state.map(t =>
        t.etiquetas.includes(action.name)
          ? { ...t, etiquetas: t.etiquetas.filter(e => e !== action.name) }
          : t,
      )
    case 'MOVE_STATUS':
      return state.map(t => (t.status === action.from ? { ...t, status: action.to } : t))
    case 'DEDUPE': {
      const seen = new Set<string>()
      return state.filter(t => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
    }
  }
}

// ─── Storage keys ──────────────────────────────────────────────────────────
export const KEY_TASKS = 'taskflow_tasks'
export const KEY_COLUMNS = 'taskflow_columns'
export const KEY_TAGS = 'taskflow_tags'
export const KEY_VIEW = 'taskflow_view'
export const KEY_THEME = 'taskflow_theme'

export const VIEW_MODES: ViewMode[] = ['list', 'kanban']

// ─── Toast ─────────────────────────────────────────────────────────────────
export interface ToastMsg {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

// ─── Context value ─────────────────────────────────────────────────────────
export interface AppContextValue {
  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'criado_em'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  reorderTasks: (tasks: Task[]) => void

  // Columns (pipeline)
  columns: KanbanCol[]
  addColumn: (col: Omit<KanbanCol, 'id'>) => void
  updateColumn: (id: string, updates: Partial<Omit<KanbanCol, 'id'>>) => void
  deleteColumn: (id: string) => void
  reorderColumns: (cols: KanbanCol[]) => void

  // Tags
  tags: Tag[]
  addTag: (tag: Omit<Tag, 'id'>) => void
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => void
  deleteTag: (id: string) => void

  // View
  view: ViewMode
  setView: (v: ViewMode) => void

  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Filters live in FilterContext — they change on every keystroke and would
  // otherwise re-render every task card through this context.

  // Modals
  isSettingsOpen: boolean
  setIsSettingsOpen: (v: boolean) => void
  viewingTask: Task | null
  setViewingTask: (t: Task | null) => void
  editingTask: Task | null
  setEditingTask: (t: Task | null) => void
  isCreating: boolean
  setIsCreating: (v: boolean) => void
  deletingTaskId: string | null
  setDeletingTaskId: (id: string | null) => void

  // Toasts
  toasts: ToastMsg[]
  showToast: (message: string, type?: ToastMsg['type']) => void
  dismissToast: (id: string) => void

  // Data management
  replaceAllData: (data: { tasks: unknown; columns: unknown; tags: unknown }) => void
  deduplicateTasks: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
