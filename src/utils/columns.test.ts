import { describe, expect, it } from 'vitest'
import type { KanbanCol, Task } from '../types'
import { isTaskDone, resolveDoneColumn, resolveOpenColumn } from './columns'

const col = (id: string, rotulo: string): KanbanCol => ({ id, rotulo, colorKey: 'gray' })

const task = (status: string): Task => ({
  id: 'a',
  titulo: 'x',
  descricao: '',
  status,
  prioridade: 'media',
  responsavel: '',
  prazo: '',
  etiquetas: [],
  criado_em: '2026-09-01T10:00:00.000Z',
})

describe('resolveDoneColumn', () => {
  it('prefers the canonical "done" id', () => {
    const cols = [col('todo', 'A fazer'), col('done', 'Concluído'), col('x', 'Arquivado')]
    expect(resolveDoneColumn(cols)!.id).toBe('done')
  })

  it('falls back to a label that reads as concluded', () => {
    // The user can rename and re-create columns, so the id is not reliable.
    const cols = [col('c1', 'A fazer'), col('c2', 'Concluídas')]
    expect(resolveDoneColumn(cols)!.id).toBe('c2')
  })

  it('falls back to the last column when nothing matches', () => {
    const cols = [col('c1', 'Ideias'), col('c2', 'Fazendo'), col('c3', 'Entregue')]
    expect(resolveDoneColumn(cols)!.id).toBe('c3')
  })

  it('returns null for an empty pipeline', () => {
    expect(resolveDoneColumn([])).toBeNull()
  })
})

describe('resolveOpenColumn', () => {
  it('returns a column that is not the done column', () => {
    const cols = [col('todo', 'A fazer'), col('done', 'Concluído')]
    expect(resolveOpenColumn(cols)!.id).toBe('todo')
  })

  it('returns the only column when the pipeline has one', () => {
    const cols = [col('done', 'Concluído')]
    expect(resolveOpenColumn(cols)!.id).toBe('done')
  })

  it('returns null for an empty pipeline', () => {
    expect(resolveOpenColumn([])).toBeNull()
  })
})

describe('isTaskDone', () => {
  it('recognizes a renamed done column', () => {
    // Regression: the checkbox compared against the literal 'done', so after
    // the column was renamed a finished task no longer read as finished — and
    // toggling it wrote a status matching no column at all.
    const cols = [col('c1', 'A fazer'), col('c2', 'Concluídas')]
    expect(isTaskDone(task('c2'), cols)).toBe(true)
    expect(isTaskDone(task('c1'), cols)).toBe(false)
  })

  it('is false when the pipeline is empty', () => {
    expect(isTaskDone(task('done'), [])).toBe(false)
  })
})
