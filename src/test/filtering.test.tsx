import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { makeTask, renderApp } from './renderApp'

const TASKS = [
  makeTask({ titulo: 'Ajustar grid do modal', status: 'todo', responsavel: 'Ana Silva' }),
  makeTask({ titulo: 'Configurar pipeline', status: 'doing', responsavel: 'Bruno Costa' }),
  makeTask({ titulo: 'Revisar documentação', status: 'done', responsavel: 'Ana Silva' }),
]

describe('search applies to the Kanban view', () => {
  it('shows every task before any query is typed', async () => {
    renderApp({ tasks: TASKS, view: 'kanban' })

    expect(await screen.findByText('Ajustar grid do modal')).toBeInTheDocument()
    expect(screen.getByText('Configurar pipeline')).toBeInTheDocument()
    expect(screen.getByText('Revisar documentação')).toBeInTheDocument()
  })

  it('filters the board by the search query', async () => {
    // Regression: the search box lives in the shared Header and is visible in
    // both views, but filtering was implemented only inside ListView — so
    // typing a query did nothing at all on the Kanban board.
    const { user } = renderApp({ tasks: TASKS, view: 'kanban' })

    const search = screen.getAllByPlaceholderText('Buscar tarefas...')[0]
    await user.type(search, 'pipeline')

    await waitFor(() => {
      expect(screen.queryByText('Ajustar grid do modal')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Configurar pipeline')).toBeInTheDocument()
    expect(screen.queryByText('Revisar documentação')).not.toBeInTheDocument()
  })

  it('matches the responsável through the search box on the Kanban', async () => {
    const { user } = renderApp({ tasks: TASKS, view: 'kanban' })

    const search = screen.getAllByPlaceholderText('Buscar tarefas...')[0]
    await user.type(search, 'bruno')

    await waitFor(() => {
      expect(screen.queryByText('Ajustar grid do modal')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Configurar pipeline')).toBeInTheDocument()
  })

  it('still filters the list view', async () => {
    const { user } = renderApp({ tasks: TASKS, view: 'list' })

    const search = screen.getAllByPlaceholderText('Buscar tarefas...')[0]
    await user.type(search, 'documentação')

    await waitFor(() => {
      expect(screen.queryByText('Configurar pipeline')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Revisar documentação')).toBeInTheDocument()
  })

  it('keeps the board usable when the query matches nothing', async () => {
    const { user } = renderApp({ tasks: TASKS, view: 'kanban' })

    const search = screen.getAllByPlaceholderText('Buscar tarefas...')[0]
    await user.type(search, 'kubernetes')

    await waitFor(() => {
      expect(screen.queryByText('Configurar pipeline')).not.toBeInTheDocument()
    })
    // The columns themselves stay on screen.
    expect(screen.getByText('A fazer')).toBeInTheDocument()
    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })
})

describe('corrupt persisted data', () => {
  it('boots and keeps the usable tasks when localStorage is malformed', async () => {
    // Regression: a task without `etiquetas` threw at `t.etiquetas.some(...)`
    // during the first render, producing a blank page with no way to recover.
    renderApp({
      rawTasks: [
        { titulo: 'Sem etiquetas' },
        { titulo: 'Prioridade invalida', prioridade: 'catastrofica' },
        { descricao: 'sem titulo' },
        null,
        'lixo',
        42,
      ],
    })

    expect(await screen.findByText('Sem etiquetas')).toBeInTheDocument()
    expect(screen.getByText('Prioridade invalida')).toBeInTheDocument()
    expect(screen.queryByText('sem titulo')).not.toBeInTheDocument()
  })

  it('reattaches a task pointing at a column that no longer exists', async () => {
    // Such a task used to render in no column at all.
    renderApp({
      rawTasks: [{ titulo: 'Órfã', status: 'coluna-que-nao-existe' }],
      columns: [
        { id: 'todo', rotulo: 'A fazer', colorKey: 'gray' },
        { id: 'done', rotulo: 'Concluído', colorKey: 'green' },
      ],
    })

    expect(await screen.findByText('Órfã')).toBeInTheDocument()
  })

  it('falls back to the seed board when the stored payload is unusable', async () => {
    renderApp({ rawTasks: 'não é um array' })
    // The pipeline still renders, so the app is operable.
    expect(await screen.findByText('A fazer')).toBeInTheDocument()
  })
})
