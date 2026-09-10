import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { KanbanCol, Tag, Task, ViewMode } from '../types'
import { DEFAULT_COLUMNS, DEFAULT_TAGS } from '../types'
import { generateSeedTasks } from '../utils/seed'
import { readJSON, readRaw, writeJSON, writeRaw } from '../utils/storage'
import {
  normalizeColumn,
  normalizeList,
  normalizeTag,
  normalizeTask,
  reattachOrphanTasks,
} from '../utils/normalize'
import {
  AppContext,
  KEY_COLUMNS,
  KEY_TAGS,
  KEY_TASKS,
  KEY_THEME,
  KEY_VIEW,
  VIEW_MODES,
  taskReducer,
} from './AppContext'
import type { AppContextValue, ToastMsg } from './AppContext'

const PERSIST_DELAY_MS = 250

/**
 * Writes `value` to localStorage after a quiet period, and flushes immediately
 * when the tab is hidden or unmounted so nothing is lost.
 *
 * Dragging a card across columns updates the store on every pointer move; a
 * synchronous JSON.stringify + localStorage write per frame stalls the drag.
 */
function useDebouncedPersist(key: string, value: unknown) {
  const latest = useRef(value)
  useEffect(() => { latest.current = value }, [value])

  useEffect(() => {
    const timer = setTimeout(() => writeJSON(key, value), PERSIST_DELAY_MS)
    return () => clearTimeout(timer)
  }, [key, value])

  useEffect(() => {
    const flush = () => writeJSON(key, latest.current)
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [key])
}

// ─── Initial state (untrusted input is normalized on the way in) ───────────
function initColumns(): KanbanCol[] {
  const stored = normalizeList(readJSON<unknown>(KEY_COLUMNS, null), normalizeColumn)
  return stored.length > 0 ? stored : DEFAULT_COLUMNS
}

function initTags(): Tag[] {
  const stored = normalizeList(readJSON<unknown>(KEY_TAGS, null), normalizeTag)
  return stored.length > 0 ? stored : DEFAULT_TAGS
}

function initTasks(columns: KanbanCol[]): Task[] {
  const fallbackStatus = columns[0]?.id ?? 'todo'
  const stored = normalizeList(readJSON<unknown>(KEY_TASKS, null), v =>
    normalizeTask(v, fallbackStatus),
  )
  if (stored.length === 0) return generateSeedTasks()
  return reattachOrphanTasks(stored, columns)
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Columns are initialized first: tasks need them to resolve an orphaned status.
  const [columns, setColumns] = useState<KanbanCol[]>(initColumns)
  const [tags, setTags] = useState<Tag[]>(initTags)
  const [tasks, dispatch] = useReducer(taskReducer, columns, initTasks)

  useDebouncedPersist(KEY_TASKS, tasks)
  useDebouncedPersist(KEY_COLUMNS, columns)
  useDebouncedPersist(KEY_TAGS, tags)

  // View
  const [view, setViewState] = useState<ViewMode>(() => {
    const stored = readRaw(KEY_VIEW)
    return VIEW_MODES.includes(stored as ViewMode) ? (stored as ViewMode) : 'kanban'
  })
  const setView = useCallback((v: ViewMode) => {
    setViewState(v)
    writeRaw(KEY_VIEW, v)
  }, [])

  // Theme — the initial class is applied by an inline script in index.html to
  // avoid a flash of the wrong theme, so read the same source of truth here.
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = readRaw(KEY_THEME)
    if (stored === 'light' || stored === 'dark') return stored
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    writeRaw(KEY_THEME, theme)
  }, [theme])
  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), [])

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  // Toasts — timers are tracked so unmount doesn't leave them pending.
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => { toastTimers.current.forEach(clearTimeout) }, [])

  const showToast = useCallback((message: string, type: ToastMsg['type'] = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      toastTimers.current = toastTimers.current.filter(t => t !== timer)
    }, 3500)
    toastTimers.current.push(timer)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ─── Task actions ─────────────────────────────────────────────────────────
  const addTask = useCallback(
    (data: Omit<Task, 'id' | 'criado_em'>) => {
      const task: Task = { ...data, id: crypto.randomUUID(), criado_em: new Date().toISOString() }
      dispatch({ type: 'ADD', task })
      showToast('Tarefa criada com sucesso!')
    },
    [showToast],
  )
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE', id, updates })
  }, [])
  const deleteTask = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE', id })
      showToast('Tarefa excluída', 'info')
    },
    [showToast],
  )
  const reorderTasks = useCallback((t: Task[]) => dispatch({ type: 'REPLACE', tasks: t }), [])

  // ─── Column actions ───────────────────────────────────────────────────────
  const addColumn = useCallback((col: Omit<KanbanCol, 'id'>) => {
    // Generate the ID outside the updater so it stays stable (React may call
    // updaters more than once).
    const id = crypto.randomUUID()
    setColumns(prev => [...prev, { ...col, id }])
    showToast('Coluna adicionada!')
  }, [showToast])

  const updateColumn = useCallback((id: string, updates: Partial<Omit<KanbanCol, 'id'>>) => {
    setColumns(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

  const deleteColumn = useCallback(
    (id: string) => {
      if (columns.length <= 1) {
        showToast('O pipeline precisa de pelo menos uma coluna.', 'error')
        return
      }
      const fallback = columns.find(c => c.id !== id)
      if (!fallback) return
      dispatch({ type: 'MOVE_STATUS', from: id, to: fallback.id })
      setColumns(prev => prev.filter(c => c.id !== id))
      showToast(`Coluna excluída. Tarefas movidas para "${fallback.rotulo}"`, 'info')
    },
    [columns, showToast],
  )

  const reorderColumns = useCallback((cols: KanbanCol[]) => setColumns(cols), [])

  // ─── Tag actions ──────────────────────────────────────────────────────────
  const addTag = useCallback(
    (tag: Omit<Tag, 'id'>) => {
      const id = crypto.randomUUID()
      setTags(prev => [...prev, { ...tag, id }])
      showToast('Etiqueta criada!')
    },
    [showToast],
  )

  const updateTag = useCallback((id: string, updates: Partial<Omit<Tag, 'id'>>) => {
    setTags(prev => {
      const existing = prev.find(t => t.id === id)
      if (!existing) return prev
      if (updates.name && updates.name !== existing.name) {
        dispatch({ type: 'RENAME_TAG', from: existing.name, to: updates.name })
      }
      return prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    })
  }, [])

  const deleteTag = useCallback(
    (id: string) => {
      setTags(prev => {
        const tag = prev.find(t => t.id === id)
        if (!tag) return prev
        dispatch({ type: 'REMOVE_TAG', name: tag.name })
        return prev.filter(t => t.id !== id)
      })
      showToast('Etiqueta excluída', 'info')
    },
    [showToast],
  )

  // ─── Data management ──────────────────────────────────────────────────────
  const replaceAllData = useCallback(
    (data: { tasks: unknown; columns: unknown; tags: unknown }) => {
      const nextColumns = normalizeList(data.columns, normalizeColumn)
      const nextTags = normalizeList(data.tags, normalizeTag)
      const resolvedColumns = nextColumns.length > 0 ? nextColumns : columns
      const fallbackStatus = resolvedColumns[0]?.id ?? 'todo'
      const nextTasks = normalizeList(data.tasks, v => normalizeTask(v, fallbackStatus))

      dispatch({ type: 'REPLACE', tasks: reattachOrphanTasks(nextTasks, resolvedColumns) })
      setColumns(resolvedColumns)
      setTags(nextTags.length > 0 ? nextTags : tags)
    },
    [columns, tags],
  )

  const deduplicateTasks = useCallback(() => {
    const unique = new Set(tasks.map(t => t.id)).size
    const removed = tasks.length - unique
    if (removed > 0) {
      dispatch({ type: 'DEDUPE' })
      showToast(`${removed} duplicata(s) removida(s).`, 'info')
    } else {
      showToast('Nenhuma duplicata encontrada.', 'info')
    }
  }, [tasks, showToast])

  // Without useMemo a new object here re-renders every consumer on every
  // provider render — every keystroke in the search box, every toast.
  const value = useMemo<AppContextValue>(
    () => ({
      tasks, addTask, updateTask, deleteTask, reorderTasks,
      columns, addColumn, updateColumn, deleteColumn, reorderColumns,
      tags, addTag, updateTag, deleteTag,
      view, setView,
      theme, toggleTheme,
      isSettingsOpen, setIsSettingsOpen,
      viewingTask, setViewingTask,
      editingTask, setEditingTask,
      isCreating, setIsCreating,
      deletingTaskId, setDeletingTaskId,
      toasts, showToast, dismissToast,
      replaceAllData, deduplicateTasks,
    }),
    [
      tasks, addTask, updateTask, deleteTask, reorderTasks,
      columns, addColumn, updateColumn, deleteColumn, reorderColumns,
      tags, addTag, updateTag, deleteTag,
      view, setView,
      theme, toggleTheme,
      isSettingsOpen, viewingTask, editingTask, isCreating, deletingTaskId,
      toasts, showToast, dismissToast,
      replaceAllData, deduplicateTasks,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
