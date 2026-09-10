import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import type { KanbanCol, Tag, Task } from '../types'
import { DEFAULT_COLUMNS, DEFAULT_TAGS } from '../types'

export function makeTask(over: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    titulo: 'Tarefa',
    descricao: '',
    status: 'todo',
    prioridade: 'media',
    responsavel: '',
    prazo: '',
    etiquetas: [],
    criado_em: '2026-09-01T10:00:00.000Z',
    ...over,
  }
}

interface SeedOptions {
  tasks?: Task[]
  /** Arbitrary (possibly malformed) payload, for testing untrusted input. */
  rawTasks?: unknown
  columns?: KanbanCol[]
  tags?: Tag[]
  view?: 'list' | 'kanban'
  theme?: 'light' | 'dark'
}

/**
 * Seeds localStorage and mounts the real App, so tests exercise the same
 * provider wiring the browser does.
 */
export function renderApp({
  tasks = [],
  rawTasks,
  columns = DEFAULT_COLUMNS,
  tags = DEFAULT_TAGS,
  view = 'kanban',
  theme = 'light',
}: SeedOptions = {}) {
  localStorage.setItem(
    'taskflow_tasks',
    JSON.stringify(rawTasks !== undefined ? rawTasks : tasks),
  )
  localStorage.setItem('taskflow_columns', JSON.stringify(columns))
  localStorage.setItem('taskflow_tags', JSON.stringify(tags))
  localStorage.setItem('taskflow_view', view)
  localStorage.setItem('taskflow_theme', theme)

  const user = userEvent.setup()
  return { user, ...render(<App />) }
}
