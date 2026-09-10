import type { KanbanCol, Task } from '../types'

// Columns are user-editable: they can be renamed, reordered and deleted. Any
// code that hardcodes the id 'done' breaks as soon as the user edits the
// pipeline — and writing status:'done' when no such column exists produces a
// task that renders in no Kanban column at all.

/** The column that means "finished", or null if the pipeline has none. */
export function resolveDoneColumn(columns: KanbanCol[]): KanbanCol | null {
  if (columns.length === 0) return null
  return (
    columns.find(c => c.id === 'done') ??
    columns.find(c => c.rotulo.toLowerCase().includes('conclu')) ??
    columns[columns.length - 1]
  )
}

/** The column a task returns to when it is un-completed. */
export function resolveOpenColumn(columns: KanbanCol[]): KanbanCol | null {
  if (columns.length === 0) return null
  const done = resolveDoneColumn(columns)
  return columns.find(c => c.id !== done?.id) ?? columns[0]
}

export function isTaskDone(task: Task, columns: KanbanCol[]): boolean {
  const done = resolveDoneColumn(columns)
  return done !== null && task.status === done.id
}
