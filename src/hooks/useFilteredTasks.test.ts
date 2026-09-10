import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { matchesSearch, sortTasks } from './useFilteredTasks'

function task(over: Partial<Task> = {}): Task {
  return {
    id: 'a',
    titulo: 'Ajustar layout',
    descricao: 'Corrigir o grid do modal',
    status: 'todo',
    prioridade: 'media',
    responsavel: 'Ana Silva',
    prazo: '',
    etiquetas: ['frontend'],
    criado_em: '2026-09-01T10:00:00.000Z',
    ...over,
  }
}

describe('matchesSearch', () => {
  it('matches everything for an empty or blank query', () => {
    expect(matchesSearch(task(), '')).toBe(true)
    expect(matchesSearch(task(), '   ')).toBe(true)
  })

  it('matches the title case-insensitively', () => {
    expect(matchesSearch(task(), 'LAYOUT')).toBe(true)
  })

  it('matches description, responsável and tags', () => {
    expect(matchesSearch(task(), 'grid')).toBe(true)
    expect(matchesSearch(task(), 'ana')).toBe(true)
    expect(matchesSearch(task(), 'frontend')).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(matchesSearch(task(), 'kubernetes')).toBe(false)
  })

  it('handles a task with empty fields', () => {
    const bare = task({ descricao: '', responsavel: '', etiquetas: [] })
    expect(matchesSearch(bare, 'ana')).toBe(false)
    expect(matchesSearch(bare, 'layout')).toBe(true)
  })
})

describe('sortTasks', () => {
  it('sorts by priority, most urgent first', () => {
    const list = [
      task({ id: '1', prioridade: 'baixa' }),
      task({ id: '2', prioridade: 'urgente' }),
      task({ id: '3', prioridade: 'media' }),
    ]
    expect(sortTasks(list, 'prioridade').map(t => t.id)).toEqual(['2', '3', '1'])
  })

  it('sorts by deadline ascending and pushes tasks with no deadline last', () => {
    const list = [
      task({ id: '1', prazo: '' }),
      task({ id: '2', prazo: '2026-10-01' }),
      task({ id: '3', prazo: '2026-09-15' }),
    ]
    expect(sortTasks(list, 'prazo').map(t => t.id)).toEqual(['3', '2', '1'])
  })

  it('keeps a stable result when neither task has a deadline', () => {
    const list = [task({ id: '1', prazo: '' }), task({ id: '2', prazo: '' })]
    expect(sortTasks(list, 'prazo').map(t => t.id)).toEqual(['1', '2'])
  })

  it('sorts by creation date, newest first', () => {
    const list = [
      task({ id: '1', criado_em: '2026-09-01T10:00:00.000Z' }),
      task({ id: '2', criado_em: '2026-09-05T10:00:00.000Z' }),
    ]
    expect(sortTasks(list, 'criado_em').map(t => t.id)).toEqual(['2', '1'])
  })

  it('does not mutate the input array', () => {
    const list = [task({ id: '1', prioridade: 'baixa' }), task({ id: '2', prioridade: 'urgente' })]
    sortTasks(list, 'prioridade')
    expect(list.map(t => t.id)).toEqual(['1', '2'])
  })
})
