import { describe, expect, it } from 'vitest'
import type { KanbanCol, Task } from '../types'
import {
  normalizeColumn,
  normalizeList,
  normalizeTag,
  normalizeTask,
  reattachOrphanTasks,
} from './normalize'

const COLUMNS: KanbanCol[] = [
  { id: 'todo', rotulo: 'A fazer', colorKey: 'gray' },
  { id: 'done', rotulo: 'Concluído', colorKey: 'green' },
]

describe('normalizeTask', () => {
  it('fills in the array and string fields a partial task is missing', () => {
    // Regression: an imported task without `etiquetas` crashed the render at
    // `t.etiquetas.some(...)`, and one without `titulo` at `.toLowerCase()`.
    const task = normalizeTask({ titulo: 'Revisar PR' }, 'todo')

    expect(task).not.toBeNull()
    expect(task!.etiquetas).toEqual([])
    expect(task!.descricao).toBe('')
    expect(task!.responsavel).toBe('')
    expect(task!.prazo).toBe('')
    expect(task!.status).toBe('todo')
    expect(task!.prioridade).toBe('media')
    expect(task!.id).toBeTruthy()
    expect(task!.criado_em).toBeTruthy()
  })

  it('drops a task with no usable title', () => {
    expect(normalizeTask({ descricao: 'sem titulo' }, 'todo')).toBeNull()
    expect(normalizeTask({ titulo: '   ' }, 'todo')).toBeNull()
    expect(normalizeTask(null, 'todo')).toBeNull()
    expect(normalizeTask('nope', 'todo')).toBeNull()
    expect(normalizeTask(42, 'todo')).toBeNull()
  })

  it('discards non-string entries inside etiquetas', () => {
    const task = normalizeTask({ titulo: 'x', etiquetas: ['api', 7, null, 'qa'] }, 'todo')
    expect(task!.etiquetas).toEqual(['api', 'qa'])
  })

  it('falls back to a valid priority when the stored one is unknown', () => {
    const task = normalizeTask({ titulo: 'x', prioridade: 'catastrofica' }, 'todo')
    expect(task!.prioridade).toBe('media')
  })

  it('keeps a valid priority', () => {
    const task = normalizeTask({ titulo: 'x', prioridade: 'urgente' }, 'todo')
    expect(task!.prioridade).toBe('urgente')
  })

  it('normalizes subtarefas and drops the unusable ones', () => {
    const task = normalizeTask(
      { titulo: 'x', subtarefas: [{ texto: 'a' }, { texto: '' }, null, { texto: 'b', concluida: true }] },
      'todo',
    )
    expect(task!.subtarefas).toHaveLength(2)
    expect(task!.subtarefas![0]).toMatchObject({ texto: 'a', concluida: false, ordem: 0 })
    expect(task!.subtarefas![1]).toMatchObject({ texto: 'b', concluida: true })
  })

  it('omits subtarefas entirely when the field is not an array', () => {
    const task = normalizeTask({ titulo: 'x', subtarefas: 'nope' }, 'todo')
    expect(task!.subtarefas).toBeUndefined()
  })
})

describe('normalizeColumn / normalizeTag', () => {
  it('replaces an unknown colour key with a safe default', () => {
    expect(normalizeColumn({ rotulo: 'Backlog', colorKey: 'chartreuse' })!.colorKey).toBe('gray')
    expect(normalizeTag({ name: 'api', color: 'chartreuse' })!.color).toBe('indigo')
  })

  it('drops entries with no label or name', () => {
    expect(normalizeColumn({ colorKey: 'blue' })).toBeNull()
    expect(normalizeTag({ color: 'blue' })).toBeNull()
  })
})

describe('normalizeList', () => {
  it('returns an empty list for anything that is not an array', () => {
    expect(normalizeList(null, normalizeColumn)).toEqual([])
    expect(normalizeList({ nope: true }, normalizeColumn)).toEqual([])
    expect(normalizeList('nope', normalizeColumn)).toEqual([])
  })

  it('removes duplicate IDs, keeping the first occurrence', () => {
    const out = normalizeList(
      [
        { id: 'a', titulo: 'primeira' },
        { id: 'a', titulo: 'duplicada' },
        { id: 'b', titulo: 'segunda' },
      ],
      v => normalizeTask(v, 'todo'),
    )
    expect(out.map(t => t.titulo)).toEqual(['primeira', 'segunda'])
  })

  it('survives a payload of pure garbage', () => {
    const out = normalizeList([null, 0, 'x', [], {}], v => normalizeTask(v, 'todo'))
    expect(out).toEqual([])
  })
})

describe('reattachOrphanTasks', () => {
  it('moves a task whose column no longer exists to the first column', () => {
    // Regression: such a task rendered in no Kanban column at all — invisible,
    // but still counted and still in storage.
    const tasks = [
      { titulo: 'orfa', status: 'coluna-removida' },
      { titulo: 'ok', status: 'done' },
    ].map(t => normalizeTask(t, 'todo')!) as Task[]

    const out = reattachOrphanTasks(tasks, COLUMNS)
    expect(out[0].status).toBe('todo')
    expect(out[1].status).toBe('done')
  })

  it('leaves tasks untouched when there are no columns to attach to', () => {
    const tasks = [normalizeTask({ titulo: 'x', status: 'whatever' }, 'todo')!]
    expect(reattachOrphanTasks(tasks, [])).toEqual(tasks)
  })
})
