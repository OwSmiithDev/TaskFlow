import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { taskReducer } from './AppContext'

function task(id: string, over: Partial<Task> = {}): Task {
  return {
    id,
    titulo: `Tarefa ${id}`,
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

describe('taskReducer', () => {
  it('ADD appends without mutating the previous state', () => {
    const before = [task('a')]
    const after = taskReducer(before, { type: 'ADD', task: task('b') })
    expect(after).toHaveLength(2)
    expect(before).toHaveLength(1)
  })

  it('UPDATE only touches the target task', () => {
    const state = [task('a'), task('b')]
    const after = taskReducer(state, { type: 'UPDATE', id: 'b', updates: { titulo: 'novo' } })
    expect(after[0]).toBe(state[0]) // identity preserved → memoized rows skip re-render
    expect(after[1].titulo).toBe('novo')
  })

  it('DELETE removes only the target task', () => {
    const after = taskReducer([task('a'), task('b')], { type: 'DELETE', id: 'a' })
    expect(after.map(t => t.id)).toEqual(['b'])
  })

  describe('RENAME_TAG', () => {
    it('renames the tag on every task that carries it', () => {
      // Regression: this ran outside the reducer over a stale `tasks` snapshot,
      // so a concurrent edit in the same batch was silently discarded.
      const state = [
        task('a', { etiquetas: ['api', 'qa'] }),
        task('b', { etiquetas: ['docs'] }),
        task('c', { etiquetas: ['api'] }),
      ]
      const after = taskReducer(state, { type: 'RENAME_TAG', from: 'api', to: 'backend' })

      expect(after[0].etiquetas).toEqual(['backend', 'qa'])
      expect(after[1].etiquetas).toEqual(['docs'])
      expect(after[2].etiquetas).toEqual(['backend'])
    })

    it('keeps the identity of tasks that do not carry the tag', () => {
      const untouched = task('b', { etiquetas: ['docs'] })
      const after = taskReducer([task('a', { etiquetas: ['api'] }), untouched], {
        type: 'RENAME_TAG',
        from: 'api',
        to: 'backend',
      })
      expect(after[1]).toBe(untouched)
    })
  })

  describe('REMOVE_TAG', () => {
    it('strips the tag from every task', () => {
      const after = taskReducer(
        [task('a', { etiquetas: ['api', 'qa'] }), task('b', { etiquetas: ['api'] })],
        { type: 'REMOVE_TAG', name: 'api' },
      )
      expect(after[0].etiquetas).toEqual(['qa'])
      expect(after[1].etiquetas).toEqual([])
    })
  })

  describe('MOVE_STATUS', () => {
    it('reassigns every task in the deleted column', () => {
      // Regression: deleting a column left its tasks pointing at an id that no
      // longer existed, making them invisible on the board.
      const after = taskReducer(
        [task('a', { status: 'review' }), task('b', { status: 'todo' }), task('c', { status: 'review' })],
        { type: 'MOVE_STATUS', from: 'review', to: 'todo' },
      )
      expect(after.map(t => t.status)).toEqual(['todo', 'todo', 'todo'])
    })
  })

  describe('DEDUPE', () => {
    it('keeps the first occurrence of each id', () => {
      const after = taskReducer(
        [task('a', { titulo: 'primeira' }), task('a', { titulo: 'copia' }), task('b')],
        { type: 'DEDUPE' },
      )
      expect(after).toHaveLength(2)
      expect(after[0].titulo).toBe('primeira')
    })

    it('is a no-op when there are no duplicates', () => {
      const state = [task('a'), task('b')]
      expect(taskReducer(state, { type: 'DEDUPE' })).toHaveLength(2)
    })
  })

  it('REPLACE swaps the whole list', () => {
    const after = taskReducer([task('a')], { type: 'REPLACE', tasks: [task('x'), task('y')] })
    expect(after.map(t => t.id)).toEqual(['x', 'y'])
  })
})
