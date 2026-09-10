import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { makeTask, renderApp } from './renderApp'

const TASK = makeTask({ titulo: 'Ajustar grid do modal', status: 'todo' })

describe('Escape closes every dialog', () => {
  it('closes the task form', async () => {
    // Regression: only TaskModal listened for Escape; the other three dialogs
    // carried role="dialog" but ignored the key entirely.
    const { user } = renderApp({ tasks: [TASK] })

    await user.click(screen.getByText('Nova tarefa'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes the settings dialog', async () => {
    const { user } = renderApp({ tasks: [TASK] })

    await user.click(screen.getByLabelText('Configurações'))
    // SettingsModal is code-split, so the first open awaits a dynamic import.
    expect(await screen.findByRole('dialog', {}, { timeout: 5000 })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes the task detail dialog', async () => {
    const { user } = renderApp({ tasks: [TASK], view: 'list' })

    await user.click(screen.getByText('Ajustar grid do modal'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes the delete confirmation without deleting', async () => {
    const { user } = renderApp({ tasks: [TASK], view: 'list' })

    await user.click(screen.getByLabelText('Excluir tarefa'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Excluir tarefa')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    // Escape must cancel, never confirm.
    expect(screen.getByText('Ajustar grid do modal')).toBeInTheDocument()
  })
})

describe('body scroll lock', () => {
  it('locks scrolling while a dialog is open and restores it after', async () => {
    const { user } = renderApp({ tasks: [TASK] })
    expect(document.body.style.overflow).toBe('')

    await user.click(screen.getByText('Nova tarefa'))
    await screen.findByRole('dialog')
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
  })
})

describe('destructive confirmation', () => {
  it('focuses the cancel button, so Enter cannot delete by accident', async () => {
    const { user } = renderApp({ tasks: [TASK], view: 'list' })

    await user.click(screen.getByLabelText('Excluir tarefa'))
    const dialog = await screen.findByRole('dialog')

    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    })
  })

  it('deletes only when the destructive action is chosen', async () => {
    const { user } = renderApp({ tasks: [TASK], view: 'list' })

    await user.click(screen.getByLabelText('Excluir tarefa'))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(screen.queryByText('Ajustar grid do modal')).not.toBeInTheDocument()
    })
  })
})

describe('focus trap', () => {
  it('keeps Tab inside the dialog', async () => {
    const { user } = renderApp({ tasks: [TASK] })

    await user.click(screen.getByText('Nova tarefa'))
    const dialog = await screen.findByRole('dialog')

    // Walk forward well past the number of controls in the panel; focus must
    // never land outside it.
    for (let i = 0; i < 30; i++) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })
})

describe('task form validation', () => {
  it('refuses to create a task with no title', async () => {
    const { user } = renderApp({ tasks: [] })

    await user.click(screen.getByText('Nova tarefa'))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Criar tarefa' }))

    expect(await screen.findByText('O título é obrigatório')).toBeInTheDocument()
    // The dialog stays open so the user can fix it.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('creates a task and closes the form', async () => {
    const { user } = renderApp({ tasks: [] })

    await user.click(screen.getByText('Nova tarefa'))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Título/), 'Nova tarefa de teste')
    await user.click(within(dialog).getByRole('button', { name: 'Criar tarefa' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Nova tarefa de teste')).toBeInTheDocument()
  })
})
