import type { KanbanCol, Priority, Subtarefa, Tag, Task } from '../types'
import { COLUMN_COLORS, PRIORITY_CONFIG, TAG_COLORS } from '../types'

// Task/column/tag data can arrive from localStorage or from a user-supplied
// backup file. Both are untrusted: a task missing `etiquetas` or `titulo` used
// to crash the render (`t.etiquetas.some` / `t.titulo.toLowerCase`).
// Everything that enters the store passes through here first.

const PRIORITIES = Object.keys(PRIORITY_CONFIG) as Priority[]

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function normalizeSubtarefa(v: unknown, index: number): Subtarefa | null {
  if (!v || typeof v !== 'object') return null
  const s = v as Record<string, unknown>
  const texto = str(s.texto)
  if (!texto) return null
  return {
    id: str(s.id) || crypto.randomUUID(),
    texto,
    concluida: s.concluida === true,
    ordem: typeof s.ordem === 'number' ? s.ordem : index,
  }
}

export function normalizeTask(v: unknown, fallbackStatus: string): Task | null {
  if (!v || typeof v !== 'object') return null
  const t = v as Record<string, unknown>

  const titulo = str(t.titulo).trim()
  if (!titulo) return null // a task with no title is unusable, drop it

  const prioridade = PRIORITIES.includes(t.prioridade as Priority)
    ? (t.prioridade as Priority)
    : 'media'

  const subtarefas = Array.isArray(t.subtarefas)
    ? t.subtarefas.map(normalizeSubtarefa).filter((s): s is Subtarefa => s !== null)
    : undefined

  return {
    id: str(t.id) || crypto.randomUUID(),
    titulo,
    descricao: str(t.descricao),
    status: str(t.status) || fallbackStatus,
    prioridade,
    responsavel: str(t.responsavel),
    prazo: str(t.prazo),
    etiquetas: strArray(t.etiquetas),
    criado_em: str(t.criado_em) || new Date().toISOString(),
    ...(subtarefas && subtarefas.length > 0 ? { subtarefas } : {}),
    ...(str(t.solucao) ? { solucao: str(t.solucao) } : {}),
    ...(str(t.data_conclusao) ? { data_conclusao: str(t.data_conclusao) } : {}),
    ...(str(t.motivo_pendencia) ? { motivo_pendencia: str(t.motivo_pendencia) } : {}),
  }
}

export function normalizeColumn(v: unknown): KanbanCol | null {
  if (!v || typeof v !== 'object') return null
  const c = v as Record<string, unknown>
  const rotulo = str(c.rotulo).trim()
  if (!rotulo) return null
  const colorKey = str(c.colorKey)
  return {
    id: str(c.id) || crypto.randomUUID(),
    rotulo,
    colorKey: (colorKey in COLUMN_COLORS ? colorKey : 'gray') as KanbanCol['colorKey'],
  }
}

export function normalizeTag(v: unknown): Tag | null {
  if (!v || typeof v !== 'object') return null
  const t = v as Record<string, unknown>
  const name = str(t.name).trim()
  if (!name) return null
  const color = str(t.color)
  return {
    id: str(t.id) || crypto.randomUUID(),
    name,
    color: (color in TAG_COLORS ? color : 'indigo') as Tag['color'],
  }
}

/** Normalizes a list and drops duplicate IDs, keeping the first occurrence. */
export function normalizeList<T extends { id: string }>(
  raw: unknown,
  normalize: (v: unknown, index: number) => T | null,
): T[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: T[] = []
  raw.forEach((item, i) => {
    const norm = normalize(item, i)
    if (!norm || seen.has(norm.id)) return
    seen.add(norm.id)
    out.push(norm)
  })
  return out
}

/**
 * Reassigns tasks whose status points at a column that no longer exists.
 * Without this, a task is invisible in the Kanban (no column renders it).
 */
export function reattachOrphanTasks(tasks: Task[], columns: KanbanCol[]): Task[] {
  if (columns.length === 0) return tasks
  const valid = new Set(columns.map(c => c.id))
  const fallback = columns[0].id
  return tasks.map(t => (valid.has(t.status) ? t : { ...t, status: fallback }))
}
